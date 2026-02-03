import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  InputAdornment,
  IconButton,
  Box,
  Tabs,
  Tab,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  FormControlLabel,
  Switch,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Handshake as HandshakeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useDealsContext } from '../context/DealsContext';
import { useReferenceEntries } from '../context/ReferenceEntriesContext';
import { useCustomFields } from '../context/CustomFieldsContext';
import { Deal, ReferenceEntry } from '../types';

interface GlobalSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onOpenDeal?: (dealId: string) => void;
  onOpenReferenceEntry?: (entryId: string) => void;
}

interface SearchResult {
  id: string;
  type: 'deal' | 'company' | 'contact';
  title: string;
  subtitle?: string;
  additionalInfo?: string[];
  data: Deal | ReferenceEntry;
  relatedTo?: string; // ID родительской сущности (для связанных сделок)
}

export const GlobalSearchDialog = ({
  open,
  onClose,
  onOpenDeal,
  onOpenReferenceEntry,
}: GlobalSearchDialogProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0); // 0: Все карточки, 1: Компании, 2: Контакты, 3: Документы
  const [searchInTitleOnly, setSearchInTitleOnly] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const { deals } = useDealsContext();
  const { entries } = useReferenceEntries();
  const { fieldDefinitions } = useCustomFields();

  // Debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Helper function to check if text matches query (case-insensitive)
  const matchesQuery = useCallback(
    (text: string | number | undefined | null): boolean => {
      if (!text) return false;
      return String(text).toLowerCase().includes(debouncedQuery.toLowerCase());
    },
    [debouncedQuery]
  );

  // Helper function to get deal field values from localStorage
  const getDealFieldValues = useCallback((dealId: string): Record<string, string | string[]> => {
    try {
      const stored = localStorage.getItem(`crm_deal_values_${dealId}`);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      return {};
    }
  }, []);

  // Helper function to find related deals for a reference entry
  const getRelatedDeals = useCallback((entryId: string): SearchResult[] => {
    const relatedDeals: SearchResult[] = [];

    deals.forEach((deal) => {
      const fieldValues = getDealFieldValues(deal.id);

      // Check if any field value references this entry
      const isRelated = Object.values(fieldValues).some((value) => {
        if (Array.isArray(value)) {
          return value.includes(entryId);
        }
        return value === entryId;
      });

      if (isRelated) {
        relatedDeals.push({
          id: deal.id,
          type: 'deal' as const,
          title: deal.title,
          subtitle: deal.customer,
          additionalInfo: [
            `${deal.amount.toLocaleString('ru-RU')} ₽`,
            deal.status,
            deal.orderNumber || '',
          ].filter(Boolean),
          data: deal,
          relatedTo: entryId,
        });
      }
    });

    return relatedDeals;
  }, [deals, getDealFieldValues]);

  // Search in deals
  const searchDeals = useMemo((): SearchResult[] => {
    if (!debouncedQuery.trim()) return [];

    console.log('🔍 Searching deals:', {
      query: debouncedQuery,
      dealsCount: deals.length,
      searchInTitleOnly
    });

    const results = deals
      .filter((deal) => {
        if (searchInTitleOnly) {
          return matchesQuery(deal.title);
        }

        // Search in all fields
        return (
          matchesQuery(deal.title) ||
          matchesQuery(deal.customer) ||
          matchesQuery(deal.orderNumber) ||
          matchesQuery(deal.description) ||
          matchesQuery(deal.assignee) ||
          matchesQuery(deal.type) ||
          matchesQuery(deal.amount)
        );
      })
      .map((deal) => ({
        id: deal.id,
        type: 'deal' as const,
        title: deal.title,
        subtitle: deal.customer,
        additionalInfo: [
          `${deal.amount.toLocaleString('ru-RU')} ₽`,
          deal.status,
          deal.orderNumber || '',
        ].filter(Boolean),
        data: deal,
      }));

    console.log('✅ Found deals:', results.length);
    return results;
  }, [deals, debouncedQuery, searchInTitleOnly, matchesQuery]);

  // Get reference definitions with their types
  const referenceDefsMap = useMemo(() => {
    const map = new Map<string, { name: string; type: 'company' | 'contact' | 'other' }>();

    fieldDefinitions.forEach((def) => {
      const nameLower = def.name.toLowerCase();
      let type: 'company' | 'contact' | 'other' = 'other';

      // Determine type by name
      if (nameLower.includes('компани') || nameLower.includes('company') || nameLower.includes('организ')) {
        type = 'company';
      } else if (nameLower.includes('контакт') || nameLower.includes('contact') || nameLower.includes('клиент') || nameLower.includes('client')) {
        type = 'contact';
      }

      map.set(def.id, { name: def.name, type });
    });

    return map;
  }, [fieldDefinitions]);

  // Search in reference entries
  const searchReferenceEntries = useMemo((): {
    companies: SearchResult[];
    contacts: SearchResult[];
  } => {
    if (!debouncedQuery.trim()) return { companies: [], contacts: [] };

    console.log('🔍 Searching entries:', {
      query: debouncedQuery,
      entriesCount: entries.length,
      referenceDefsMap: Array.from(referenceDefsMap.entries()),
      searchInTitleOnly
    });

    const companies: SearchResult[] = [];
    const contacts: SearchResult[] = [];

    entries.forEach((entry) => {
      const refDef = referenceDefsMap.get(entry.referenceDefinitionId);
      const isCompany = refDef?.type === 'company';
      const isContact = refDef?.type === 'contact';

      let matches = false;

      if (searchInTitleOnly) {
        matches = matchesQuery(entry.displayValue);
      } else {
        // Search in displayValue
        matches = matchesQuery(entry.displayValue);

        // Search in all fields
        if (!matches) {
          matches = entry.fields.some((field) => {
            if (Array.isArray(field.value)) {
              return field.value.some((v) => matchesQuery(v));
            }
            return matchesQuery(field.value);
          });
        }
      }

      if (matches) {
        console.log('✅ Match found:', entry.displayValue, 'isCompany:', isCompany, 'isContact:', isContact);

        // Extract phone and email for display
        const phoneField = entry.fields.find((f) => f.fieldType === 'phone');
        const emailField = entry.fields.find((f) => f.fieldType === 'email');

        const additionalInfo: string[] = [];
        if (phoneField?.value) {
          additionalInfo.push(String(phoneField.value));
        }
        if (emailField?.value) {
          additionalInfo.push(String(emailField.value));
        }

        const result: SearchResult = {
          id: entry.id,
          type: isCompany ? 'company' : 'contact',
          title: entry.displayValue,
          additionalInfo,
          data: entry,
        };

        if (isCompany) {
          companies.push(result);
          // Find related deals for this company
          const relatedDeals = getRelatedDeals(entry.id);
          console.log(`  → Found ${relatedDeals.length} related deals for company:`, entry.displayValue);
          relatedDeals.forEach(deal => companies.push(deal));
        } else if (isContact) {
          contacts.push(result);
          // Find related deals for this contact
          const relatedDeals = getRelatedDeals(entry.id);
          console.log(`  → Found ${relatedDeals.length} related deals for contact:`, entry.displayValue);
          relatedDeals.forEach(deal => contacts.push(deal));
        }
      }
    });

    console.log('✅ Found entries:', { companies: companies.length, contacts: contacts.length });
    return { companies, contacts };
  }, [
    entries,
    debouncedQuery,
    searchInTitleOnly,
    referenceDefsMap,
    matchesQuery,
    getRelatedDeals,
  ]);

  // Combined results with tab filtering
  const allResults = useMemo(() => {
    const allItems = [
      ...searchDeals,
      ...searchReferenceEntries.companies,
      ...searchReferenceEntries.contacts,
    ];

    // Filter based on active tab
    switch (activeTab) {
      case 0: // Все карточки
        return allItems;
      case 1: // Только компании
        return allItems.filter(item =>
          item.type === 'company' ||
          (item.type === 'deal' && searchReferenceEntries.companies.some(c => c.id === item.relatedTo))
        );
      case 2: // Только контакты
        return allItems.filter(item =>
          item.type === 'contact' ||
          (item.type === 'deal' && searchReferenceEntries.contacts.some(c => c.id === item.relatedTo))
        );
      case 3: // Документы (пока пусто)
        return [];
      default:
        return allItems;
    }
  }, [searchDeals, searchReferenceEntries, activeTab]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'deal') {
      onOpenDeal?.(result.id);
    } else {
      onOpenReferenceEntry?.(result.id);
    }
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    onClose();
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'deal':
        return <HandshakeIcon />;
      case 'company':
        return <BusinessIcon />;
      case 'contact':
        return <PersonIcon />;
      default:
        return null;
    }
  };

  const renderResults = () => {
    if (!debouncedQuery.trim()) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 300,
            color: 'text.secondary',
          }}
        >
          <Typography variant="body1">Введите текст для поиска</Typography>
        </Box>
      );
    }

    if (isSearching) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 300,
          }}
        >
          <CircularProgress />
        </Box>
      );
    }

    if (allResults.length === 0) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 300,
            color: 'text.secondary',
          }}
        >
          <Typography variant="body1">Нет результатов</Typography>
        </Box>
      );
    }

    // Group results by type, filtered by active tab
    let groupedResults: {
      deals: SearchResult[];
      companies: SearchResult[];
      contacts: SearchResult[];
    };

    switch (activeTab) {
      case 0: // Все карточки
        groupedResults = {
          deals: searchDeals.filter(d => !d.relatedTo),
          companies: searchReferenceEntries.companies,
          contacts: searchReferenceEntries.contacts,
        };
        break;
      case 1: // Только компании
        groupedResults = {
          deals: [],
          companies: searchReferenceEntries.companies,
          contacts: [],
        };
        break;
      case 2: // Только контакты
        groupedResults = {
          deals: [],
          companies: [],
          contacts: searchReferenceEntries.contacts,
        };
        break;
      default:
        groupedResults = {
          deals: searchDeals.filter(d => !d.relatedTo),
          companies: searchReferenceEntries.companies,
          contacts: searchReferenceEntries.contacts,
        };
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {groupedResults.deals.length > 0 && (
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}
            >
              Сделки ({groupedResults.deals.length})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {groupedResults.deals.map((result) => (
                <Card key={result.id} variant="outlined">
                  <CardActionArea onClick={() => handleResultClick(result)}>
                    <CardContent sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ color: '#7B1FA2' }}>{getResultIcon(result.type)}</Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {result.title}
                            {result.relatedTo && (
                              <Chip
                                label="Связанная сделка"
                                size="small"
                                sx={{ ml: 1, height: 20 }}
                                color="primary"
                                variant="outlined"
                              />
                            )}
                          </Typography>
                          {result.subtitle && (
                            <Typography variant="body2" color="text.secondary">
                              {result.subtitle}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {result.additionalInfo?.map((info, idx) => (
                            <Chip key={idx} label={info} size="small" />
                          ))}
                        </Box>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          </Box>
        )}

        {groupedResults.companies.length > 0 && (
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}
            >
              Компании ({groupedResults.companies.length})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {groupedResults.companies.map((result) => (
                <Card key={`${result.type}-${result.id}`} variant="outlined">
                  <CardActionArea onClick={() => handleResultClick(result)}>
                    <CardContent sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ color: '#7B1FA2' }}>{getResultIcon(result.type)}</Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {result.title}
                            {result.relatedTo && (
                              <Chip
                                label="Связанная сделка"
                                size="small"
                                sx={{ ml: 1, height: 20 }}
                                color="primary"
                                variant="outlined"
                              />
                            )}
                          </Typography>
                          {result.additionalInfo && result.additionalInfo.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                              {result.additionalInfo.map((info, idx) => {
                                const isPhone = /^\+?\d[\d\s\-()]+$/.test(info);
                                const isEmail = /@/.test(info);
                                return (
                                  <Box
                                    key={idx}
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 0.5,
                                      fontSize: '0.875rem',
                                      color: 'text.secondary',
                                    }}
                                  >
                                    {isPhone && <PhoneIcon sx={{ fontSize: 16 }} />}
                                    {isEmail && <EmailIcon sx={{ fontSize: 16 }} />}
                                    {info}
                                  </Box>
                                );
                              })}
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          </Box>
        )}

        {groupedResults.contacts.length > 0 && (
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}
            >
              Контакты ({groupedResults.contacts.length})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {groupedResults.contacts.map((result) => (
                <Card key={`${result.type}-${result.id}`} variant="outlined">
                  <CardActionArea onClick={() => handleResultClick(result)}>
                    <CardContent sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ color: '#7B1FA2' }}>{getResultIcon(result.type)}</Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {result.title}
                            {result.relatedTo && (
                              <Chip
                                label="Связанная сделка"
                                size="small"
                                sx={{ ml: 1, height: 20 }}
                                color="primary"
                                variant="outlined"
                              />
                            )}
                          </Typography>
                          {result.additionalInfo && result.additionalInfo.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                              {result.additionalInfo.map((info, idx) => {
                                const isPhone = /^\+?\d[\d\s\-()]+$/.test(info);
                                const isEmail = /@/.test(info);
                                return (
                                  <Box
                                    key={idx}
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 0.5,
                                      fontSize: '0.875rem',
                                      color: 'text.secondary',
                                    }}
                                  >
                                    {isPhone && <PhoneIcon sx={{ fontSize: 16 }} />}
                                    {isEmail && <EmailIcon sx={{ fontSize: 16 }} />}
                                    {info}
                                  </Box>
                                );
                              })}
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '60vh',
          maxHeight: '80vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <TextField
          autoFocus
          fullWidth
          placeholder="Введите текст для поиска"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="standard"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            disableUnderline: true,
            sx: {
              fontSize: '1.25rem',
            },
          }}
        />
        <IconButton onClick={handleClose} sx={{ ml: 1 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ px: 3, pb: 1 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="ВСЕ КАРТОЧКИ" />
            <Tab label="КОМПАНИИ" />
            <Tab label="КОНТАКТЫ" />
            <Tab label="ДОКУМЕНТЫ" disabled />
          </Tabs>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={searchInTitleOnly}
                onChange={(e) => setSearchInTitleOnly(e.target.checked)}
                size="small"
              />
            }
            label="Искать только в названии"
          />

          <Typography variant="caption" color="text.secondary">
            Найдено: {allResults.length}
          </Typography>
        </Box>
      </Box>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>{renderResults()}</DialogContent>
    </Dialog>
  );
};
