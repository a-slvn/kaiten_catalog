import { useMemo, useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Paper,
  IconButton,
  Stack,
  DialogContentText,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Link as LinkIcon,
  Numbers as NumbersIcon,
  Contacts as ContactsIcon,
  TextFields as TextFieldsIcon,
  FormatListBulleted as ListIcon,
  Receipt as ReceiptIcon,
  FolderOpen as FolderOpenIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { useCatalogs } from '../context/CatalogsContext';
import { useReferenceEntries } from '../context/ReferenceEntriesContext';
import { useDealsContext } from '../context/DealsContext';
import { Catalog, CatalogFieldDef, CatalogEntry, Deal } from '../types';

interface CatalogEntryDetailDialogProps {
  open: boolean;
  onClose: () => void;
  catalog: Catalog;
  entryId: string;
  onEdit: () => void;
  onOpenCatalogEntry?: (catalogId: string, entryId: string) => void;
  onOpenDeal?: (dealId: string) => void;
}

export const CatalogEntryDetailDialog = ({
  open,
  onClose,
  catalog,
  entryId,
  onEdit,
  onOpenCatalogEntry,
  onOpenDeal,
}: CatalogEntryDetailDialogProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showAllFields, setShowAllFields] = useState(false);
  const [visibleDealsCount, setVisibleDealsCount] = useState(15);
  const { getEntry, deleteEntry, getCatalog: getCatalogById } = useCatalogs();
  const { getEntry: getReferenceEntry } = useReferenceEntries();
  const { getDealsForEntryWithLinked } = useDealsContext();

  const entry = getEntry(entryId);
  const INITIAL_FIELDS_COUNT = 8;
  const OVERVIEW_DEALS_COUNT = 3;
  const DEALS_PAGE_SIZE = 15;

  // Извлекаем ID контактов из полей типа reference
  const linkedContactIds = useMemo((): string[] => {
    if (!entry) return [];

    const contactIds: string[] = [];

    catalog.fields.forEach((fieldDef) => {
      if (fieldDef.type === 'reference') {
        const fieldValue = entry.fields.find((f) => f.fieldId === fieldDef.id);
        if (fieldValue?.value) {
          if (Array.isArray(fieldValue.value)) {
            contactIds.push(...(fieldValue.value as string[]));
          } else if (typeof fieldValue.value === 'string') {
            contactIds.push(fieldValue.value);
          }
        }
      }
    });

    return contactIds;
  }, [entry, catalog.fields]);

  // Получаем сделки для компании и её контактов
  const relatedDeals = useMemo((): Deal[] => {
    if (!entry) return [];
    return getDealsForEntryWithLinked(entry.id, linkedContactIds);
  }, [entry, linkedContactIds, getDealsForEntryWithLinked]);

  useEffect(() => {
    setActiveTab(0);
    setShowAllFields(false);
    setVisibleDealsCount(DEALS_PAGE_SIZE);
  }, [entryId]);

  const getRawFieldValue = (fieldDef: CatalogFieldDef): CatalogEntry['fields'][number]['value'] | null => {
    if (!entry) return null;
    const fieldValue = entry.fields.find((f) => f.fieldId === fieldDef.id);
    return fieldValue?.value ?? null;
  };

  const hasFieldValue = (fieldDef: CatalogFieldDef) => {
    const value = getRawFieldValue(fieldDef);
    if (value === null || value === '') return false;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  };

  const filledFields = useMemo(() => {
    return catalog.fields.filter(hasFieldValue);
  }, [catalog.fields, entry]);

  const keyFields = useMemo(() => {
    return filledFields.slice(0, INITIAL_FIELDS_COUNT);
  }, [filledFields]);

  if (!entry) {
    return null;
  }

  const handleDelete = () => {
    deleteEntry(entryId);
    setIsDeleteDialogOpen(false);
    onClose();
  };

  // Получаем иконку для типа поля
  const getFieldIcon = (type: string) => {
    const iconStyle = { fontSize: 18, color: '#7B1FA2' };
    switch (type) {
      case 'email':
        return <EmailIcon sx={iconStyle} />;
      case 'phone':
        return <PhoneIcon sx={iconStyle} />;
      case 'url':
        return <LinkIcon sx={iconStyle} />;
      case 'numeric':
        return <NumbersIcon sx={iconStyle} />;
      case 'reference':
        return <ContactsIcon sx={iconStyle} />;
      case 'catalog_ref':
        return <FolderOpenIcon sx={iconStyle} />;
      case 'select':
      case 'multiselect':
        return <ListIcon sx={iconStyle} />;
      default:
        return <TextFieldsIcon sx={iconStyle} />;
    }
  };

  // Рендер значения поля
  const renderFieldValue = (fieldDef: CatalogFieldDef, entry: CatalogEntry) => {
    const fieldValue = entry.fields.find((f) => f.fieldId === fieldDef.id);
    if (!fieldValue || fieldValue.value === null || fieldValue.value === '') {
      return (
        <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
          Не указано
        </Typography>
      );
    }

    const value = fieldValue.value;

    switch (fieldDef.type) {
      case 'email':
        return (
          <Typography
            variant="body2"
            component="a"
            href={`mailto:${value}`}
            sx={{ color: '#1976d2', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            {String(value)}
          </Typography>
        );

      case 'phone':
        return (
          <Typography
            variant="body2"
            component="a"
            href={`tel:${value}`}
            sx={{ color: '#1976d2', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            {String(value)}
          </Typography>
        );

      case 'url':
        return (
          <Typography
            variant="body2"
            component="a"
            href={String(value)}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: '#1976d2', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            {String(value)}
          </Typography>
        );

      case 'numeric':
        return (
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {value.toLocaleString('ru-RU')}
          </Typography>
        );

      case 'select':
        return (
          <Chip
            label={String(value)}
            size="small"
            sx={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}
          />
        );

      case 'multiselect':
        if (Array.isArray(value) && value.length > 0) {
          return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {value.map((v, i) => (
                <Chip
                  key={i}
                  label={String(v)}
                  size="small"
                  sx={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}
                />
              ))}
            </Box>
          );
        }
        return (
          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            Не выбрано
          </Typography>
        );

      case 'reference':
        if (Array.isArray(value) && value.length > 0) {
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {value.map((id, i) => {
                const refEntry = getReferenceEntry(id as string);
                return (
                  <ReferenceCard
                    key={i}
                    entry={refEntry}
                    entryId={id as string}
                    onClick={() => {
                      if (!fieldDef.targetCatalogId) return;
                      onOpenCatalogEntry?.(fieldDef.targetCatalogId, id as string);
                    }}
                  />
                );
              })}
            </Box>
          );
        }
        if (typeof value === 'string' && value) {
          const refEntry = getReferenceEntry(value);
          return (
            <ReferenceCard
              entry={refEntry}
              entryId={value}
              onClick={() => {
                if (!fieldDef.targetCatalogId) return;
                onOpenCatalogEntry?.(fieldDef.targetCatalogId, value);
              }}
            />
          );
        }
        return (
          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            Не выбрано
          </Typography>
        );

      case 'catalog_ref':
        if (Array.isArray(value) && value.length > 0) {
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {value.map((id, i) => {
                const catEntry = getEntry(id as string);
                return (
                  <CatalogRefCard
                    key={i}
                    entry={catEntry}
                    entryId={id as string}
                    fieldDef={fieldDef}
                    getCatalog={getCatalogById}
                    onClick={() => {
                      if (!fieldDef.targetCatalogId) return;
                      onOpenCatalogEntry?.(fieldDef.targetCatalogId, id as string);
                    }}
                  />
                );
              })}
            </Box>
          );
        }
        if (typeof value === 'string' && value) {
          const catEntry = getEntry(value);
          return (
            <CatalogRefCard
              entry={catEntry}
              entryId={value}
              fieldDef={fieldDef}
              getCatalog={getCatalogById}
              onClick={() => {
                if (!fieldDef.targetCatalogId) return;
                onOpenCatalogEntry?.(fieldDef.targetCatalogId, value);
              }}
            />
          );
        }
        return (
          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            Не выбрано
          </Typography>
        );

      default:
        return (
          <Typography variant="body2">
            {String(value)}
          </Typography>
        );
    }
  };

  const renderFieldBlock = (fieldDef: CatalogFieldDef) => (
    <Box key={fieldDef.id} sx={{ mb: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        {getFieldIcon(fieldDef.type)}
        <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
          {fieldDef.name}
          {fieldDef.required && <span style={{ color: '#d32f2f' }}> *</span>}
        </Typography>
      </Box>
      <Box sx={{ pl: 3.5 }}>
        {renderFieldValue(fieldDef, entry)}
      </Box>
    </Box>
  );

  const renderDealCard = (deal: Deal, compact = false) => (
    <Paper
      key={deal.id}
      elevation={0}
      sx={{
        p: compact ? 1.25 : 1.5,
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        backgroundColor: '#fafafa',
        cursor: onOpenDeal ? 'pointer' : 'default',
        '&:hover': onOpenDeal
          ? {
              backgroundColor: '#f5f5f5',
              borderColor: '#7B1FA2',
            }
          : undefined,
      }}
      onClick={() => onOpenDeal?.(deal.id)}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: deal.avatarColor || '#7B1FA2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ReceiptIcon sx={{ color: 'white', fontSize: 20 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
            {deal.title}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {deal.orderNumber && `${deal.orderNumber} • `}
            {deal.createdDate && new Date(deal.createdDate).toLocaleDateString('ru-RU')}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {deal.amount?.toLocaleString('ru-RU')} ₽
          </Typography>
        </Box>
      </Box>
    </Paper>
  );

  const overviewFields = showAllFields ? filledFields : keyFields.slice(0, 6);
  const overviewDeals = relatedDeals.slice(0, OVERVIEW_DEALS_COUNT);
  const visibleDealItems = relatedDeals.slice(0, visibleDealsCount);

  const renderOverviewTab = () => (
    <Stack spacing={2.5}>
      <Paper elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Ключевые поля
          </Typography>
        </Box>
        {overviewFields.length > 0 ? (
          overviewFields.map(renderFieldBlock)
        ) : (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Нет заполненных полей
          </Typography>
        )}
        {filledFields.length > 6 && (
          <Button
            size="small"
            onClick={() => setShowAllFields((prev) => !prev)}
            startIcon={showAllFields ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ textTransform: 'none' }}
          >
            {showAllFields ? 'Свернуть поля' : 'Показать все поля'}
          </Button>
        )}
      </Paper>

      <Paper elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Последние связанные сделки
          </Typography>
          <Button size="small" onClick={() => setActiveTab(1)} sx={{ textTransform: 'none' }}>
            Все сделки
          </Button>
        </Box>
        {overviewDeals.length > 0 ? (
          <Stack spacing={1.25}>
            {overviewDeals.map((deal) => renderDealCard(deal, true))}
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Нет связанных сделок
          </Typography>
        )}
      </Paper>
    </Stack>
  );

  const renderDealsTab = () => (
    <Stack spacing={2}>
      {visibleDealItems.length > 0 ? (
        <Stack spacing={1.25}>
          {visibleDealItems.map((deal) => renderDealCard(deal))}
        </Stack>
      ) : (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Нет связанных сделок
        </Typography>
      )}

      {visibleDealItems.length < relatedDeals.length && (
        <Button
          onClick={() => setVisibleDealsCount((prev) => prev + DEALS_PAGE_SIZE)}
          startIcon={<ExpandMoreIcon />}
          sx={{ textTransform: 'none', alignSelf: 'flex-start' }}
        >
          {`Показать еще ${Math.min(DEALS_PAGE_SIZE, relatedDeals.length - visibleDealItems.length)}`}
        </Button>
      )}
    </Stack>
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        aria-labelledby="catalog-entry-dialog-title"
        PaperProps={{
          sx: {
            minHeight: '72vh',
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Typography id="catalog-entry-dialog-title" variant="h6" sx={{ fontWeight: 600 }}>
            {entry.displayValue}
          </Typography>
          <IconButton onClick={onClose} size="small" aria-label="Закрыть окно">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ overscrollBehavior: 'contain' }}>
          <Box>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs
                value={activeTab}
                onChange={(_event, nextValue: number) => setActiveTab(nextValue)}
                variant="fullWidth"
              >
                <Tab label="Обзор" />
                <Tab label={`Сделки (${relatedDeals.length})`} />
              </Tabs>
            </Box>

            {activeTab === 0 && renderOverviewTab()}
            {activeTab === 1 && renderDealsTab()}
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            p: 2,
            justifyContent: 'space-between',
            position: 'sticky',
            bottom: 0,
            bgcolor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Button
            startIcon={<DeleteIcon />}
            onClick={() => setIsDeleteDialogOpen(true)}
            sx={{ color: '#d32f2f', textTransform: 'none' }}
          >
            Удалить
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={onClose} sx={{ textTransform: 'none' }}>
              Закрыть
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={onEdit}
              sx={{
                backgroundColor: '#7B1FA2',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#6A1B9A',
                },
              }}
            >
              Редактировать
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        aria-labelledby="confirm-delete-title"
      >
        <DialogTitle id="confirm-delete-title">Удалить запись?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Это действие нельзя отменить. Запись "{entry.displayValue}" будет удалена без возможности восстановления.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsDeleteDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Отмена
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" sx={{ textTransform: 'none' }}>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Компонент карточки связанной записи
interface ReferenceCardProps {
  entry: any | undefined;
  entryId: string;
  onClick?: () => void;
}

// Компонент карточки связанной записи каталога
interface CatalogRefCardProps {
  entry: CatalogEntry | undefined;
  entryId: string;
  fieldDef: CatalogFieldDef;
  getCatalog: (id: string) => Catalog | undefined;
  onClick?: () => void;
}

const CatalogRefCard = ({ entry, entryId, fieldDef, getCatalog, onClick }: CatalogRefCardProps) => {
  const targetCatalog = fieldDef.targetCatalogId
    ? getCatalog(fieldDef.targetCatalogId)
    : undefined;

  if (!entry) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          backgroundColor: '#fafafa',
        }}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Запись не найдена (ID: {entryId})
        </Typography>
      </Paper>
    );
  }

  // Получаем определение полей из целевого каталога для отображения
  const displayFields = targetCatalog
    ? entry.fields.slice(0, 3).map((f) => {
        const def = targetCatalog.fields.find((fd) => fd.id === f.fieldId);
        return { fieldName: def?.name || f.fieldId, value: f.value };
      })
    : [];

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 1.5,
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        backgroundColor: '#fafafa',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': {
          backgroundColor: '#f5f5f5',
          borderColor: onClick ? '#7B1FA2' : '#e0e0e0',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <FolderOpenIcon sx={{ fontSize: 16, color: '#7B1FA2' }} />
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {entry.displayValue}
        </Typography>
      </Box>
      {displayFields.length > 0 && (
        <Typography variant="caption" sx={{ color: 'text.secondary', pl: 3 }}>
          {displayFields
            .map((f) => {
              const val = Array.isArray(f.value) ? f.value.join(', ') : f.value;
              return `${f.fieldName}: ${val}`;
            })
            .join(' | ')}
        </Typography>
      )}
    </Paper>
  );
};

const ReferenceCard = ({ entry, entryId, onClick }: ReferenceCardProps) => {
  if (!entry) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          backgroundColor: '#fafafa',
        }}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Запись не найдена (ID: {entryId})
        </Typography>
      </Paper>
    );
  }

  const normalizeFieldValue = (value: unknown): string => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item)).filter(Boolean).join(', ');
    }
    return value ? String(value) : '';
  };

  const pickByName = (patterns: string[]): string => {
    const match = entry.fields?.find((field: any) => {
      const name = String(field.fieldName || '').toLowerCase();
      return patterns.some((pattern) => name.includes(pattern));
    });
    return normalizeFieldValue(match?.value);
  };

  const position = pickByName(['должност', 'position', 'role']);
  const phone = pickByName(['телефон', 'phone', 'mobile']);
  const email = pickByName(['почт', 'email', 'e-mail']);
  const primaryMeta = [position, phone].filter(Boolean).join(' • ');
  const secondaryMeta = !phone && email ? email : '';
  const fallbackMeta = entry.fields
    ?.map((field: any) => normalizeFieldValue(field.value))
    .filter(Boolean)
    .slice(0, 2)
    .join(' • ');
  const metaLine = primaryMeta || secondaryMeta || fallbackMeta;

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 1.25,
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        backgroundColor: '#fff',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': {
          backgroundColor: onClick ? '#fafafa' : '#fff',
          borderColor: onClick ? '#7B1FA2' : '#e0e0e0',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>
          {entry.displayValue}
        </Typography>
        {onClick && <OpenInNewIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
      </Box>
      {metaLine && (
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {metaLine}
        </Typography>
      )}
    </Paper>
  );
};
