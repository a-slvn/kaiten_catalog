import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  IconButton,
  Chip,
  Avatar,
  TextField,
  Divider,
  Button,
  Tooltip,
  Collapse,
} from '@mui/material';
import {
  Close as CloseIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  PlayArrow as PlayArrowIcon,
  ArrowForward as ArrowForwardIcon,
  PushPin as PushPinIcon,
  Info as InfoIcon,
  Share as ShareIcon,
  MoreHoriz as MoreHorizIcon,
  AccessTime as AccessTimeIcon,
  Update as UpdateIcon,
  Add as AddIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Mic as MicIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { CatalogEntry, Deal } from '../types';
import { useState, useEffect } from 'react';
import { AddFieldMenu } from './AddFieldMenu';
import { ReferenceFieldDisplay } from './ReferenceFieldDisplay';
import { CatalogFieldSelect } from './CatalogFieldSelect';
import { CustomFieldDefinition, ReferenceFieldDef, useCustomFields } from '../context/CustomFieldsContext';
import { CreateReferenceEntryDialog } from './CreateReferenceEntryDialog';
import { CreateCatalogEntryDialog } from './CreateCatalogEntryDialog';
import { useReferenceEntries } from '../context/ReferenceEntriesContext';
import { useCatalogs } from '../context/CatalogsContext';

interface DealModalProps {
  deal: Deal | null;
  open: boolean;
  onClose: () => void;
}

const DEAL_FIELDS_STORAGE_KEY = 'crm_deal_fields';
const DEAL_VALUES_STORAGE_KEY = 'crm_deal_values';

export const DealModal = ({
  deal,
  open,
  onClose,
}: DealModalProps) => {
  const { getEntry } = useReferenceEntries();
  const { getEntry: getCatalogEntry, getCatalog } = useCatalogs();
  const { fieldDefinitions } = useCustomFields();
  const [isFavorite, setIsFavorite] = useState(false);
  const [comment, setComment] = useState('');
  const [addMenuAnchor, setAddMenuAnchor] = useState<HTMLElement | null>(null);

  // Инициализация из localStorage - теперь храним только ID полей
  const [addedFieldIds, setAddedFieldIds] = useState<string[]>(() => {
    if (!deal) return [];
    try {
      const stored = localStorage.getItem(`${DEAL_FIELDS_STORAGE_KEY}_${deal.id}`);
      if (!stored) return [];

      const parsed = JSON.parse(stored);

      // Миграция: если это старый формат (массив объектов), преобразуем в массив ID
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
        return parsed.map((field: CustomFieldDefinition) => field.id);
      }

      return parsed;
    } catch (error) {
      console.error('Failed to load deal fields from localStorage:', error);
      return [];
    }
  });

  const [fieldValues, setFieldValues] = useState<Record<string, string | number | string[]>>(() => {
    if (!deal) return {};
    try {
      const stored = localStorage.getItem(`${DEAL_VALUES_STORAGE_KEY}_${deal.id}`);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load deal values from localStorage:', error);
      return {};
    }
  });

  const [creatingNewForField, setCreatingNewForField] = useState<{ fieldId: string; referenceId: string } | null>(null);
  const [creatingNewForCatalog, setCreatingNewForCatalog] = useState<{ fieldId: string; catalogId: string } | null>(null);
  const [editingCatalogEntry, setEditingCatalogEntry] = useState<{ entryId: string; catalogId: string } | null>(null);
  const [editingEntry, setEditingEntry] = useState<{ entryId: string; referenceId: string } | null>(null);
  const [expandedCatalogDetails, setExpandedCatalogDetails] = useState<Record<string, boolean>>({});

  // Загрузка данных при смене сделки
  useEffect(() => {
    if (!deal) return;

    try {
      const storedFields = localStorage.getItem(`${DEAL_FIELDS_STORAGE_KEY}_${deal.id}`);
      const storedValues = localStorage.getItem(`${DEAL_VALUES_STORAGE_KEY}_${deal.id}`);

      if (storedFields) {
        const parsed = JSON.parse(storedFields);
        // Миграция: если это старый формат (массив объектов), преобразуем в массив ID
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
          setAddedFieldIds(parsed.map((field: CustomFieldDefinition) => field.id));
        } else {
          setAddedFieldIds(parsed);
        }
      } else {
        setAddedFieldIds([]);
      }

      setFieldValues(storedValues ? JSON.parse(storedValues) : {});
    } catch (error) {
      console.error('Failed to load deal data from localStorage:', error);
    }
  }, [deal?.id]);

  // Сохранение в localStorage при изменении
  useEffect(() => {
    if (!deal) return;
    try {
      localStorage.setItem(`${DEAL_FIELDS_STORAGE_KEY}_${deal.id}`, JSON.stringify(addedFieldIds));
    } catch (error) {
      console.error('Failed to save deal fields to localStorage:', error);
    }
  }, [addedFieldIds, deal]);

  useEffect(() => {
    if (!deal) return;
    try {
      localStorage.setItem(`${DEAL_VALUES_STORAGE_KEY}_${deal.id}`, JSON.stringify(fieldValues));
    } catch (error) {
      console.error('Failed to save deal values to localStorage:', error);
    }
  }, [fieldValues, deal]);

  const handleAddMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAddMenuAnchor(event.currentTarget);
  };

  const handleAddMenuClose = () => {
    setAddMenuAnchor(null);
  };

  const handleAddField = (fieldId: string) => {
    // Проверяем, не добавлено ли уже это поле
    if (!addedFieldIds.includes(fieldId)) {
      setAddedFieldIds((prev) => [...prev, fieldId]);
    }
  };

  const handleDeleteField = (fieldId: string) => {
    setAddedFieldIds((prev) => prev.filter((id) => id !== fieldId));
  };

  const handleCreateNewCatalogEntry = (fieldId: string, catalogId: string) => {
    setCreatingNewForCatalog({ fieldId, catalogId });
  };

  const handleEditCatalogEntry = (entryId: string, catalogId: string) => {
    setEditingCatalogEntry({ entryId, catalogId });
  };

  const handleCatalogEntryCreated = (entryId: string) => {
    if (creatingNewForCatalog) {
      const { fieldId, catalogId } = creatingNewForCatalog;
      const fieldDef = fieldDefinitions.find((field) => field.id === fieldId);
      const catalogDef = getCatalog(catalogId);
      const isMultiple = Boolean(catalogDef?.isMultiple || fieldDef?.isCatalogMultiple);

      if (isMultiple) {
        const currentValue = fieldValues[fieldId];
        const currentIds = Array.isArray(currentValue)
          ? currentValue
          : currentValue
            ? [String(currentValue)]
            : [];

        const nextIds = currentIds.includes(entryId)
          ? currentIds
          : [...currentIds, entryId];

        handleFieldValueChange(fieldId, nextIds);
      } else {
        handleFieldValueChange(fieldId, entryId);
      }
    }
    setCreatingNewForCatalog(null);
  };

  const handleCatalogEntryUpdated = () => {
    setEditingCatalogEntry(null);
  };

  const handleFieldValueChange = (fieldId: string, value: string | string[]) => {
    setFieldValues((prev) => ({ ...prev, [fieldId]: value }));

    // Автозаполнение компании при выборе контакта
    // Находим определение поля, чтобы узнать его название
    const changedField = fieldDefinitions.find((f) => f.id === fieldId);

    // Если изменилось поле "Контакты" и оно имеет значение
    if (changedField?.name === 'Контакты' && value) {
      // Получаем ID выбранного контакта (берем первый, если это массив)
      const contactId = Array.isArray(value) ? value[0] : value;

      if (contactId) {
        // Получаем данные контакта
        const contact = getEntry(contactId);

        if (contact) {
          // Ищем в полях контакта поле "Компания"
          const companyField = contact.fields.find((f) => f.fieldName === 'Компания');

          if (companyField && companyField.value) {
            // Получаем ID компании
            const companyId = Array.isArray(companyField.value)
              ? companyField.value[0]
              : companyField.value;

            // Находим поле "Компания" в добавленных полях сделки
            const companyFieldDef = fieldDefinitions.find((f) => f.name === 'Компании');

            if (companyFieldDef && addedFieldIds.includes(companyFieldDef.id)) {
              // Автоматически заполняем поле "Компания", только если оно еще не заполнено
              setFieldValues((prev) => {
                // Проверяем, заполнено ли уже поле компании
                const currentCompanyValue = prev[companyFieldDef.id];
                const hasCompanyValue = currentCompanyValue && (
                  Array.isArray(currentCompanyValue)
                    ? currentCompanyValue.length > 0
                    : currentCompanyValue !== ''
                );

                // Если поле компании пустое, автоматически заполняем его
                if (!hasCompanyValue) {
                  return { ...prev, [companyFieldDef.id]: companyId };
                }

                return prev;
              });
            }
          }
        }
      }
    }
  };

  const getCatalogDetailsKey = (fieldId: string, entryId: string) => `${fieldId}:${entryId}`;

  const toggleCatalogDetails = (fieldId: string, entryId: string) => {
    const detailsKey = getCatalogDetailsKey(fieldId, entryId);
    setExpandedCatalogDetails((prev) => ({
      ...prev,
      [detailsKey]: !(prev[detailsKey] ?? true),
    }));
  };

  const resolveLinkedDisplayValue = (value: string): string => {
    const referenceEntry = getEntry(value);
    if (referenceEntry) return referenceEntry.displayValue;

    const catalogEntry = getCatalogEntry(value);
    if (catalogEntry) return catalogEntry.displayValue;

    return value;
  };

  const formatCatalogFieldValue = (value: string | string[] | number | null): string => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return '-';
      return value.map((v) => resolveLinkedDisplayValue(String(v))).join(', ');
    }

    if (typeof value === 'string') {
      return resolveLinkedDisplayValue(value);
    }

    return String(value);
  };

  const handleCreateNewEntry = (fieldId: string, referenceId: string) => {
    setCreatingNewForField({ fieldId, referenceId });
  };

  const handleEditEntry = (entryId: string, referenceId: string) => {
    setEditingEntry({ entryId, referenceId });
  };

  const handleEntryCreated = (entryId: string) => {
    // Установить созданную запись в поле
    if (creatingNewForField) {
      handleFieldValueChange(creatingNewForField.fieldId, entryId);
    }
    setCreatingNewForField(null);
  };

  const handleEntryUpdated = () => {
    setEditingEntry(null);
  };

  if (!deal) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'В работе':
        return '#FFA726';
      case 'Выиграно':
        return '#66BB6A';
      case 'Потеряно':
        return '#EF5350';
      default:
        return '#9E9E9E';
    }
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ru-RU');
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'месяц назад';
    if (diffDays === 2) return '2 дня назад';
    return `${diffDays} дней назад`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
          width: 'min(1200px, calc(100vw - 32px))',
          maxWidth: '1200px',
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Header */}
        <Box sx={{ p: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                {deal.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  {deal.orderNumber || '#58998178'} Заказчик {deal.customer || 'Андрей Селиванова'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: '#999', fontSize: '0.875rem' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccessTimeIcon sx={{ fontSize: '1rem' }} />
                  <Typography variant="caption">
                    Создана {formatDate(deal.createdDate) || 'месяц назад'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <UpdateIcon sx={{ fontSize: '1rem' }} />
                  <Typography variant="caption">
                    Перемещена {formatDate(deal.movedDate) || '2 дня назад'}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box>
              <IconButton onClick={() => setIsFavorite(!isFavorite)} size="small">
                {isFavorite ? (
                  <StarIcon sx={{ color: '#FFC107' }} />
                ) : (
                  <StarBorderIcon sx={{ color: '#999' }} />
                )}
              </IconButton>
              <IconButton onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <IconButton
              onClick={handleAddMenuOpen}
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: '50%',
                width: 40,
                height: 40,
                backgroundColor: '#7C3AED',
                color: '#fff',
                '&:hover': { backgroundColor: '#6D28D9' },
              }}
            >
              <AddIcon sx={{ fontSize: '1.2rem' }} />
            </IconButton>
            <IconButton
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: '50%',
                width: 40,
                height: 40,
                '&:hover': { backgroundColor: '#f5f5f5' },
              }}
            >
              <PlayArrowIcon sx={{ fontSize: '1.2rem' }} />
            </IconButton>
            <Button
              variant="outlined"
              startIcon={<ArrowForwardIcon />}
              sx={{
                borderRadius: 5,
                textTransform: 'none',
                borderColor: '#e0e0e0',
                color: '#424242',
                px: 2,
                '&:hover': {
                  borderColor: '#ccc',
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              ПЕРЕГОВ...
            </Button>
            <IconButton
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: '50%',
                width: 40,
                height: 40,
                '&:hover': { backgroundColor: '#f5f5f5' },
              }}
            >
              <PushPinIcon sx={{ fontSize: '1.2rem' }} />
            </IconButton>
            <IconButton
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: '50%',
                width: 40,
                height: 40,
                '&:hover': { backgroundColor: '#f5f5f5' },
              }}
            >
              <InfoIcon sx={{ fontSize: '1.2rem' }} />
            </IconButton>
            <IconButton
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: '50%',
                width: 40,
                height: 40,
                '&:hover': { backgroundColor: '#f5f5f5' },
              }}
            >
              <ShareIcon sx={{ fontSize: '1.2rem' }} />
            </IconButton>
            <IconButton
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: '50%',
                width: 40,
                height: 40,
                '&:hover': { backgroundColor: '#f5f5f5' },
              }}
            >
              <MoreHorizIcon sx={{ fontSize: '1.2rem' }} />
            </IconButton>
          </Box>
        </Box>

        <Divider />

        {/* Main Content */}
        <Box sx={{ display: 'flex', height: 'calc(90vh - 300px)' }}>
          {/* Left Panel */}
          <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>
            {/* Type */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ color: '#999', mb: 1 }}>
                Тип
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography sx={{ fontSize: '0.75rem', color: '#666' }}>C</Typography>
                </Box>
                <Typography variant="body2">{deal.type || 'Card'}</Typography>
              </Box>
            </Box>

            {/* Participants */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ color: '#999', mb: 1 }}>
                Участники
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: deal.avatarColor,
                    fontSize: '0.875rem',
                  }}
                >
                  {deal.assignee?.charAt(0) || 'О'}
                </Avatar>
                <Typography variant="body2">{deal.assignee || 'Ответственный'}</Typography>
                <IconButton size="small" sx={{ ml: 1 }}>
                  <AddIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Box>
            </Box>

            {/* Deal Status */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ color: '#999', mb: 1 }}>
                Результат сделки
              </Typography>
              <Chip
                label={deal.status}
                sx={{
                  backgroundColor: getStatusColor(deal.status),
                  color: '#fff',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  height: '32px',
                }}
              />
            </Box>

            {/* Amount */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ color: '#999', mb: 1 }}>
                Сделка
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {formatAmount(deal.amount)}
              </Typography>
            </Box>

            {/* Added Custom Fields */}
            {addedFieldIds.length > 0 && (
              <Box sx={{ mb: 3 }}>
                {addedFieldIds.map((fieldId) => {
                  // Получаем актуальное определение поля из контекста
                  const field = fieldDefinitions.find((f) => f.id === fieldId);
                  if (!field) return null; // Поле было удалено

                  // Для справочников используем компонент отображения с возможностью выбора
                  if (field.type === 'reference') {
                    // Когда справочник добавляется как поле в карточку сделки,
                    // сам field.id является ID справочника
                    // Определяем тип на основе флага isMultipleSelection
                    const fieldType = field.isMultipleSelection ? 'multiselect' : 'reference';
                    const referenceFieldDef: ReferenceFieldDef = {
                      id: field.id,
                      name: field.name,
                      type: fieldType as 'reference' | 'multiselect',
                      required: false,
                      targetReferenceId: field.id, // Сам справочник
                      targetReferenceName: field.name,
                    };
                    return (
                      <Box key={field.id} sx={{ mb: 2, '&:hover .field-delete-btn': { opacity: 1 } }}>
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: '140px minmax(0, 1fr) auto',
                            alignItems: 'flex-start',
                            columnGap: 1.25,
                          }}
                        >
                          <Typography variant="body2" sx={{ color: '#999', pt: 1 }}>
                            {field.name}
                          </Typography>
                          <Box sx={{ minWidth: 0 }}>
                            <ReferenceFieldDisplay
                              fieldDef={referenceFieldDef}
                              value={(() => {
                                const val = fieldValues[field.id];
                                if (val === undefined || val === null) return field.isMultipleSelection ? [] : '';
                                if (Array.isArray(val)) return val;
                                return String(val);
                              })()}
                              onChange={(val) => handleFieldValueChange(field.id, val)}
                              onCreateNew={() => handleCreateNewEntry(field.id, field.id)}
                              onEdit={(entryId, refId) => handleEditEntry(entryId, refId)}
                            />
                          </Box>
                          <Tooltip title="Удалить поле из карточки">
                            <IconButton
                              className="field-delete-btn"
                              size="small"
                              onClick={() => handleDeleteField(field.id)}
                              sx={{
                                p: 0.5,
                                color: '#999',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                mt: 0.5,
                                '&:hover': {
                                  color: '#f44336',
                                  backgroundColor: 'rgba(244, 67, 54, 0.08)',
                                },
                              }}
                            >
                              <DeleteIcon sx={{ fontSize: '1.1rem' }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    );
                  }

                  // Для каталогов — показываем селект справа от заголовка
                  if (field.type === 'catalog' && field.catalogId) {
                    const catalog = getCatalog(field.catalogId);
                    const isMulti = Boolean(catalog?.isMultiple || field.isCatalogMultiple);
                    const currentValue = fieldValues[field.id];
                    const normalizedValue = (() => {
                      if (currentValue === undefined || currentValue === null) return isMulti ? [] : '';
                      if (Array.isArray(currentValue)) return currentValue;
                      return String(currentValue);
                    })();
                    const selectedCatalogIds = Array.isArray(normalizedValue)
                      ? normalizedValue
                      : normalizedValue
                        ? [normalizedValue]
                        : [];
                    const selectedCatalogEntries = selectedCatalogIds
                      .map((id) => getCatalogEntry(id))
                      .filter((entry): entry is CatalogEntry => Boolean(entry));

                    return (
                      <Box key={field.id} sx={{ mb: 2, '&:hover .field-delete-btn': { opacity: 1 } }}>
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: '140px minmax(0, 1fr) auto',
                            alignItems: 'flex-start',
                            columnGap: 1.25,
                            rowGap: 0.75,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ color: '#999', pt: 1, flexShrink: 0 }}
                          >
                            {field.name}
                          </Typography>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <CatalogFieldSelect
                              catalogId={field.catalogId}
                              value={normalizedValue}
                              onChange={(val) => handleFieldValueChange(field.id, val)}
                              multiple={isMulti}
                              onCreateNew={catalog?.isEditable
                                ? () => handleCreateNewCatalogEntry(field.id, field.catalogId!)
                                : undefined}
                              onEdit={catalog?.isEditable
                                ? (entryId: string, catId: string) => handleEditCatalogEntry(entryId, catId)
                                : undefined}
                            />
                          </Box>
                          <Tooltip title="Удалить поле из карточки">
                            <IconButton
                              className="field-delete-btn"
                              size="small"
                              onClick={() => handleDeleteField(field.id)}
                              sx={{
                                p: 0.5,
                                color: '#999',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                mt: 0.5,
                                '&:hover': {
                                  color: '#f44336',
                                  backgroundColor: 'rgba(244, 67, 54, 0.08)',
                                },
                              }}
                            >
                              <DeleteIcon sx={{ fontSize: '1.1rem' }} />
                            </IconButton>
                          </Tooltip>

                          {selectedCatalogEntries.length > 0 && (
                            <Box sx={{ gridColumn: '1 / 4' }}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                                {selectedCatalogEntries.map((entry) => {
                                  const detailsKey = getCatalogDetailsKey(field.id, entry.id);
                                  const detailsExpanded = expandedCatalogDetails[detailsKey] ?? true;

                                  return (
                                    <Box
                                      key={entry.id}
                                      sx={{
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 1.5,
                                        backgroundColor: '#fafafa',
                                        p: 1,
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          mb: detailsExpanded ? 0.75 : 0,
                                        }}
                                      >
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>
                                          {entry.displayValue}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                          {catalog?.isEditable && (
                                            <Tooltip title="Редактировать запись">
                                              <IconButton
                                                size="small"
                                                onClick={() => handleEditCatalogEntry(entry.id, field.catalogId!)}
                                                sx={{
                                                  p: 0.35,
                                                  color: '#999',
                                                  '&:hover': {
                                                    color: '#1976D2',
                                                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                                  },
                                                }}
                                              >
                                                <EditIcon sx={{ fontSize: 15 }} />
                                              </IconButton>
                                            </Tooltip>
                                          )}
                                          <Tooltip title={detailsExpanded ? 'Скрыть поля' : 'Показать поля'}>
                                            <IconButton
                                              size="small"
                                              onClick={() => toggleCatalogDetails(field.id, entry.id)}
                                              sx={{ p: 0.35, color: '#7B1FA2' }}
                                            >
                                              {detailsExpanded
                                                ? <ExpandLessIcon sx={{ fontSize: 18 }} />
                                                : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
                                            </IconButton>
                                          </Tooltip>
                                        </Box>
                                      </Box>

                                      <Collapse in={detailsExpanded}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.35 }}>
                                          {entry.fields.map((fieldValue) => {
                                            const fieldDef = catalog?.fields.find((f) => f.id === fieldValue.fieldId);
                                            return (
                                              <Box
                                                key={`${entry.id}-${fieldValue.fieldId}`}
                                                sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}
                                              >
                                                <Typography variant="caption" sx={{ color: '#999' }}>
                                                  {fieldDef?.name || fieldValue.fieldId}:
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#333' }}>
                                                  {formatCatalogFieldValue(fieldValue.value)}
                                                </Typography>
                                              </Box>
                                            );
                                          })}
                                        </Box>
                                      </Collapse>
                                    </Box>
                                  );
                                })}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    );
                  }

                  // Для остальных типов - простое текстовое поле с кнопкой удаления
                  return (
                    <Box key={field.id} sx={{ mb: 2, '&:hover .field-delete-btn': { opacity: 1 } }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2" sx={{ color: '#999' }}>
                          {field.name}
                        </Typography>
                        <Tooltip title="Удалить поле из карточки">
                          <IconButton
                            className="field-delete-btn"
                            size="small"
                            onClick={() => handleDeleteField(field.id)}
                            sx={{
                              p: 0.5,
                              color: '#999',
                              opacity: 0,
                              transition: 'opacity 0.2s',
                              '&:hover': {
                                color: '#f44336',
                                backgroundColor: 'rgba(244, 67, 54, 0.08)',
                              },
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: '1.1rem' }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder={`Введите ${field.name.toLowerCase()}`}
                        variant="outlined"
                        value={fieldValues[field.id] || ''}
                        onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>
            )}

            {/* Description */}
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 1,
                }}
              >
                <InsertDriveFileIcon sx={{ fontSize: '1.25rem', color: '#999' }} />
                <Typography variant="body2" sx={{ color: '#999' }}>
                  Описание
                </Typography>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Введите текст описания задачи, чтобы сделать её более понятной"
                variant="outlined"
                defaultValue={deal.description || ''}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>
          </Box>

          {/* Right Panel - Comments */}
          <Box
            sx={{
              width: 400,
              borderLeft: '1px solid #e0e0e0',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Комментарии
              </Typography>
            </Box>
            <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}>
              <Typography variant="body2" sx={{ color: '#999', textAlign: 'center', py: 4 }}>
                Комментариев пока нет
              </Typography>
            </Box>
            <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: deal.avatarColor,
                    fontSize: '0.75rem',
                  }}
                >
                  {deal.assignee?.charAt(0) || 'У'}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    placeholder="Напишите комментарий"
                    variant="outlined"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontSize: '0.875rem',
                      },
                    }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                    <IconButton size="small">
                      <MicIcon sx={{ fontSize: '1.2rem' }} />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      {/* Add Field Menu */}
      <AddFieldMenu
        anchorEl={addMenuAnchor}
        open={Boolean(addMenuAnchor)}
        onClose={handleAddMenuClose}
        onAddField={handleAddField}
      />

      {/* Create/Edit Reference Entry Dialog */}
      <CreateReferenceEntryDialog
        open={Boolean(creatingNewForField) || Boolean(editingEntry)}
        referenceDefinitionId={creatingNewForField?.referenceId || editingEntry?.referenceId || null}
        onClose={() => {
          setCreatingNewForField(null);
          setEditingEntry(null);
        }}
        onCreate={handleEntryCreated}
        editMode={Boolean(editingEntry)}
        entryToEdit={editingEntry ? getEntry(editingEntry.entryId) : undefined}
        onUpdate={handleEntryUpdated}
      />

      {/* Create/Edit Catalog Entry Dialog */}
      <CreateCatalogEntryDialog
        open={Boolean(creatingNewForCatalog) || Boolean(editingCatalogEntry)}
        catalogId={creatingNewForCatalog?.catalogId || editingCatalogEntry?.catalogId || null}
        onClose={() => {
          setCreatingNewForCatalog(null);
          setEditingCatalogEntry(null);
        }}
        onCreate={handleCatalogEntryCreated}
        editMode={Boolean(editingCatalogEntry)}
        entryToEdit={editingCatalogEntry ? getCatalogEntry(editingCatalogEntry.entryId) : undefined}
        onUpdate={handleCatalogEntryUpdated}
      />
    </Dialog>
  );
};
