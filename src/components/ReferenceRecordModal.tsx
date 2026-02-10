import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Tabs,
  Tab,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Chip,
  Paper,
  Grid,
  Stack,
  Avatar,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { useReferenceEntries } from '../context/ReferenceEntriesContext';
import { useCustomFields } from '../context/CustomFieldsContext';
import { ReferenceFieldValue, ReferenceEntry, Deal } from '../types';
import { CreateReferenceEntryDialog } from './CreateReferenceEntryDialog';

interface Props {
  open: boolean;
  entryId: string | null;
  onClose: () => void;
  deals?: Deal[]; // Сделки, связанные с этой записью
  onNavigateToEntry?: (entryId: string) => void;
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

export default function ReferenceRecordModal({
  open,
  entryId,
  onClose,
  deals = [],
  onNavigateToEntry,
}: Props) {
  const [currentTab, setCurrentTab] = useState(0);
  const [isEditing] = useState(false);
  const [, setEditedFields] = useState<Record<string, string | string[]>>({});
  const [creatingNewForField, setCreatingNewForField] = useState<{ fieldId: string; referenceId: string } | null>(null);

  const { getEntryDetail, getEntry } = useReferenceEntries();
  const { fieldDefinitions } = useCustomFields();

  const entryDetail = useMemo(() => {
    if (!entryId) return null;
    return getEntryDetail(entryId);
  }, [entryId, getEntryDetail]);

  const referenceDefinition = useMemo(() => {
    if (!entryDetail) return null;
    return fieldDefinitions.find((def) => def.id === entryDetail.referenceDefinitionId);
  }, [entryDetail, fieldDefinitions]);

  // Инициализация editedFields при входе в режим редактирования
  useEffect(() => {
    if (isEditing && entryDetail) {
      const initialValues: Record<string, string | string[]> = {};
      entryDetail.fields.forEach((field) => {
        // Преобразуем number в string
        const value = typeof field.value === 'number' ? String(field.value) : field.value;
        initialValues[field.fieldId] = value;
      });
      setEditedFields(initialValues);
    }
  }, [isEditing, entryDetail]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleNavigateToEntry = (targetEntryId: string) => {
    if (onNavigateToEntry) {
      onNavigateToEntry(targetEntryId);
      setCurrentTab(0);
    }
  };

  const handleEdit = () => {
    console.log('Edit button clicked');
    // TODO: Implement edit functionality
  };

  const handleFieldValueChange = (fieldId: string, value: string | string[]) => {
    setEditedFields((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleEntryCreated = (newEntryId: string) => {
    if (creatingNewForField) {
      handleFieldValueChange(creatingNewForField.fieldId, newEntryId);
    }
    setCreatingNewForField(null);
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
                  icon={<BusinessIcon />}
                />
              );
            })}
          </Stack>
        );
      } else if (field.value) {
        const refEntry = getEntry(field.value as string);
        return (
          <Chip
            label={refEntry?.displayValue || field.value}
            onClick={() => handleNavigateToEntry(field.value as string)}
            clickable
            color="primary"
            variant="outlined"
            size="small"
            icon={<BusinessIcon />}
          />
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
      <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Grid container spacing={3}>
          {entryDetail.fields.map((field) => (
            <Grid item xs={12} sm={6} key={field.fieldId}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
                  {field.fieldName}
                </Typography>
                <Box sx={{ mt: 0.5 }}>{renderFieldValue(field)}</Box>
              </Box>
            </Grid>
          ))}

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
              Создано
            </Typography>
            <Typography variant="body2">
              {new Date(entryDetail.createdAt).toLocaleString('ru-RU')}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
              Автор
            </Typography>
            <Typography variant="body2">{entryDetail.createdBy}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
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
        <Box sx={{ textAlign: 'center', py: 6 }}>
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

          // Определяем иконку в зависимости от типа справочника
          const RefIcon = refDefName.toLowerCase().includes('компани') ? BusinessIcon : PersonIcon;

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
                  <RefIcon />
                  {refDefName}
                  <Chip label={entries.length} size="small" color="primary" />
                </Typography>
              </Box>

              <List disablePadding>
                {entries.map((entry: ReferenceEntry, idx: number) => (
                  <Box key={entry.id}>
                    {idx > 0 && <Divider sx={{ my: 1 }} />}
                    <ListItem disablePadding>
                      <ListItemButton
                        onClick={() => handleNavigateToEntry(entry.id)}
                        sx={{
                          px: 2,
                          py: 1.5,
                          borderRadius: 1,
                        }}
                      >
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          <RefIcon />
                        </Avatar>
                        <ListItemText
                          primary={
                            <Typography variant="body1" fontWeight={500}>
                              {entry.displayValue}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              Обновлено: {new Date(entry.updatedAt).toLocaleDateString('ru-RU')}
                            </Typography>
                          }
                        />
                      </ListItemButton>
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

    const relatedDeals = deals;

    if (relatedDeals.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 6 }}>
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
              <Avatar sx={{ bgcolor: deal.avatarColor }}>
                <ReceiptIcon />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" fontWeight={500}>
                  {deal.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {deal.orderNumber} • {new Date(deal.createdDate || '').toLocaleDateString('ru-RU')}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6" fontWeight={600}>
                  {deal.amount.toLocaleString('ru-RU')} ₽
                </Typography>
                <Chip label={deal.status} size="small" color={deal.status === 'Выиграно' ? 'success' : 'default'} />
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

  // Определяем, какие вкладки показывать
  const hasLinkedEntries = Object.keys(entryDetail.linkedEntries).length > 0;
  const hasDeals = deals.length > 0;

  return (
    <>
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
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
              {referenceDefinition?.name === 'Компании' ? <BusinessIcon /> : <PersonIcon />}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
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
            <IconButton onClick={handleEdit} size="small" color="primary" aria-label="Редактировать запись">
              <EditIcon />
            </IconButton>
            <IconButton onClick={onClose} edge="end" aria-label="Закрыть окно">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
              },
            }}
          >
            <Tab label="Информация" />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {referenceDefinition?.name === 'Компании' ? 'Контакты' : 'Компании'}
                  {hasLinkedEntries && (
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
                  {hasDeals && <Chip label={deals.length} size="small" sx={{ height: 20 }} />}
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

      {/* Create Reference Entry Dialog */}
      <CreateReferenceEntryDialog
        open={Boolean(creatingNewForField)}
        referenceDefinitionId={creatingNewForField?.referenceId || null}
        onClose={() => setCreatingNewForField(null)}
        onCreate={handleEntryCreated}
        editMode={false}
      />
    </>
  );
}
