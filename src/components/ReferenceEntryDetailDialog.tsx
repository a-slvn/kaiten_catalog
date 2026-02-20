import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Tabs,
  Tab,
  Typography,
  Breadcrumbs,
  List,
  ListItem,
  ListItemText,
  Button,
  Divider,
  Chip,
  Paper,
  Grid,
  Stack,
  Link,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Business as BusinessIcon,
  NavigateNext as NavigateNextIcon,
  Link as LinkIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { useReferenceEntries } from '../context/ReferenceEntriesContext';
import { useCustomFields } from '../context/CustomFieldsContext';
import { useDealsContext } from '../context/DealsContext';
import { ReferenceFieldValue, ReferenceEntry, Deal } from '../types';

interface Props {
  open: boolean;
  entryId: string | null;
  onClose: () => void;
  onNavigateToEntry?: (entryId: string) => void;
  breadcrumbsPrefix?: Array<{
    label: string;
    onClick?: () => void;
  }>;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ReferenceEntryDetailDialog({
  open,
  entryId,
  onClose,
  onNavigateToEntry,
  breadcrumbsPrefix = [],
}: Props) {
  const [currentTab, setCurrentTab] = useState(0);
  const { getEntryDetail, getEntry } = useReferenceEntries();
  const { fieldDefinitions } = useCustomFields();
  const { getDealsForEntryWithLinked } = useDealsContext();

  const entryDetail = useMemo(() => {
    if (!entryId) return null;
    return getEntryDetail(entryId);
  }, [entryId, getEntryDetail]);

  const referenceDefinition = useMemo(() => {
    if (!entryDetail) return null;
    return fieldDefinitions.find((def) => def.id === entryDetail.referenceDefinitionId);
  }, [entryDetail, fieldDefinitions]);

  // Получаем сделки для записи и её связанных записей (контактов для компании)
  const relatedDeals = useMemo((): Deal[] => {
    if (!entryDetail) return [];

    // Собираем ID всех связанных записей (например, контактов компании)
    const linkedEntryIds: string[] = [];
    Object.values(entryDetail.linkedEntries).forEach((entries) => {
      entries.forEach((entry) => {
        linkedEntryIds.push(entry.id);
      });
    });

    return getDealsForEntryWithLinked(entryDetail.id, linkedEntryIds);
  }, [entryDetail, getDealsForEntryWithLinked]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleNavigateToEntry = (targetEntryId: string) => {
    if (onNavigateToEntry) {
      onNavigateToEntry(targetEntryId);
      setCurrentTab(0); // Сбросить на первую вкладку при навигации
    }
  };

  const handleEdit = () => {
    // TODO: Открыть диалог редактирования
    console.log('Edit entry:', entryId);
  };

  const renderFieldValue = (field: ReferenceFieldValue) => {
    // Для полей типа reference - делаем значение кликабельным
    if (field.fieldType === 'reference') {
      if (Array.isArray(field.value)) {
        return (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {field.value.map((refId) => {
              const refEntry = getEntry(refId as string);
              return (
                <Chip
                  key={refId}
                  label={refEntry?.displayValue || refId}
                  onClick={() => handleNavigateToEntry(refId as string)}
                  clickable
                  color="primary"
                  variant="outlined"
                  size="small"
                  icon={<LinkIcon />}
                />
              );
            })}
          </Stack>
        );
      } else if (field.value) {
        const refEntry = getEntry(field.value as string);
        return (
          <Link
            component="button"
            variant="body2"
            onClick={() => handleNavigateToEntry(field.value as string)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              textAlign: 'left',
            }}
          >
            <LinkIcon fontSize="small" />
            {refEntry?.displayValue || field.value}
          </Link>
        );
      }
    }

    // Для массивов (multiselect)
    if (Array.isArray(field.value)) {
      return (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {field.value.map((val, idx) => (
            <Chip key={idx} label={val} size="small" />
          ))}
        </Stack>
      );
    }

    // Обычное значение
    return <Typography variant="body2">{field.value || '-'}</Typography>;
  };

  const renderInformationTab = () => {
    if (!entryDetail) return null;

    return (
      <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Grid container spacing={3}>
          {entryDetail.fields.map((field) => (
            <Grid item xs={12} sm={6} key={field.fieldId}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  {field.fieldName}
                  {field.fieldType === 'reference' && (
                    <Chip
                      label={field.fieldType}
                      size="small"
                      sx={{ ml: 1, height: 16, fontSize: '0.65rem' }}
                    />
                  )}
                </Typography>
                <Box sx={{ mt: 0.5 }}>{renderFieldValue(field)}</Box>
              </Box>
            </Grid>
          ))}

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Создано
            </Typography>
            <Typography variant="body2">
              {new Date(entryDetail.createdAt).toLocaleString('ru-RU')}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Автор
            </Typography>
            <Typography variant="body2">{entryDetail.createdBy}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Обновлено
            </Typography>
            <Typography variant="body2">
              {new Date(entryDetail.updatedAt).toLocaleString('ru-RU')}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  const renderLinkedEntriesTab = () => {
    if (!entryDetail) return null;

    const linkedEntriesGroups = Object.entries(entryDetail.linkedEntries);

    if (linkedEntriesGroups.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <BusinessIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Нет связанных записей
          </Typography>
        </Box>
      );
    }

    return (
      <Stack spacing={3}>
        {linkedEntriesGroups.map(([refDefId, entries]) => {
          const refDef = fieldDefinitions.find((def) => def.id === refDefId);
          const refDefName = refDef?.name || 'Неизвестный справочник';

          return (
            <Paper key={refDefId} elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon />
                  {refDefName}
                  <Chip label={entries.length} size="small" />
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={() => {
                    // TODO: Открыть диалог создания новой записи в этом справочнике
                    console.log('Add new entry to:', refDefId);
                  }}
                >
                  Добавить {refDefName}
                </Button>
              </Box>

              <List disablePadding>
                {entries.map((entry: ReferenceEntry, idx: number) => (
                  <Box key={entry.id}>
                    {idx > 0 && <Divider sx={{ my: 1 }} />}
                    <ListItem
                      disablePadding
                      sx={{
                        cursor: 'pointer',
                        px: 2,
                        py: 1,
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                      onClick={() => handleNavigateToEntry(entry.id)}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={500}>
                            {entry.displayValue}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            Обновлено: {new Date(entry.updatedAt).toLocaleDateString('ru-RU')}
                          </Typography>
                        }
                      />
                      <LinkIcon sx={{ color: 'action.disabled', ml: 1 }} />
                    </ListItem>
                  </Box>
                ))}
              </List>
            </Paper>
          );
        })}
      </Stack>
    );
  };

  const renderDealsTab = () => {
    if (!entryDetail) return null;

    if (relatedDeals.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <ReceiptIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Нет связанных сделок
          </Typography>
        </Box>
      );
    }

    return (
      <Stack spacing={2}>
        {relatedDeals.map((deal) => (
          <Paper key={deal.id} elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: deal.avatarColor || 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ReceiptIcon sx={{ color: 'white' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" fontWeight={500}>
                  {deal.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {deal.orderNumber && `${deal.orderNumber} • `}
                  {deal.createdDate && new Date(deal.createdDate).toLocaleDateString('ru-RU')}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6" fontWeight={600}>
                  {deal.amount?.toLocaleString('ru-RU')} ₽
                </Typography>
                <Chip
                  label={deal.status}
                  size="small"
                  color={
                    deal.status === 'Выиграно'
                      ? 'success'
                      : deal.status === 'Потеряно'
                        ? 'error'
                        : 'default'
                  }
                />
              </Box>
            </Box>
          </Paper>
        ))}
      </Stack>
    );
  };

  if (!open || !entryId || !entryDetail) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '70vh',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          pb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
          <BusinessIcon sx={{ color: 'primary.main', fontSize: 32 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {breadcrumbsPrefix.length > 0 && (
              <Breadcrumbs
                separator={<NavigateNextIcon sx={{ fontSize: 16 }} />}
                sx={{ mb: 0.5 }}
                aria-label="Хлебные крошки"
              >
                {breadcrumbsPrefix.map((item, index) => (
                  item.onClick ? (
                    <Link
                      key={`${item.label}-${index}`}
                      component="button"
                      variant="caption"
                      onClick={item.onClick}
                      sx={{
                        textDecoration: 'none',
                        color: 'text.secondary',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <Typography
                      key={`${item.label}-${index}`}
                      variant="caption"
                      sx={{ color: 'text.secondary' }}
                    >
                      {item.label}
                    </Typography>
                  )
                ))}
                <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 600 }}>
                  {entryDetail.displayValue}
                </Typography>
              </Breadcrumbs>
            )}
            <Typography variant="h6" noWrap>
              {entryDetail.displayValue}
            </Typography>
            {referenceDefinition && (
              <Typography variant="caption" color="text.secondary">
                {referenceDefinition.name}
              </Typography>
            )}
          </Box>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            size="small"
            onClick={handleEdit}
          >
            Изменить
          </Button>
          <IconButton onClick={onClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="Вкладки детальной информации"
          variant="fullWidth"
        >
          <Tab label="Информация" />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Связанные
                {Object.keys(entryDetail.linkedEntries).length > 0 && (
                  <Chip
                    label={Object.values(entryDetail.linkedEntries).reduce(
                      (acc, entries) => acc + entries.length,
                      0
                    )}
                    size="small"
                    sx={{ height: 20 }}
                  />
                )}
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Сделки
                {relatedDeals.length > 0 && (
                  <Chip label={relatedDeals.length} size="small" sx={{ height: 20 }} />
                )}
              </Box>
            }
          />
        </Tabs>
      </Box>

      <DialogContent sx={{ px: 3 }}>
        <TabPanel value={currentTab} index={0}>
          {renderInformationTab()}
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          {renderLinkedEntriesTab()}
        </TabPanel>
        <TabPanel value={currentTab} index={2}>
          {renderDealsTab()}
        </TabPanel>
      </DialogContent>
    </Dialog>
  );
}
