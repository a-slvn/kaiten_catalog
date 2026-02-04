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
} from '@mui/icons-material';
import { Deal } from '../types';
import { useState, useEffect } from 'react';
import { AddFieldMenu } from './AddFieldMenu';
import { ReferenceFieldDisplay } from './ReferenceFieldDisplay';
import { CatalogFieldDisplay } from './CatalogFieldDisplay';
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
      handleFieldValueChange(creatingNewForCatalog.fieldId, entryId);
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
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
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
                      <Box key={field.id} sx={{ mb: 2 }}>
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
                              size="small"
                              onClick={() => handleDeleteField(field.id)}
                              sx={{
                                p: 0.5,
                                color: '#999',
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
                    );
                  }

                  // Для каталогов — используем CatalogFieldDisplay
                  if (field.type === 'catalog' && field.catalogId) {
                    return (
                      <Box key={field.id} sx={{ mb: 2 }}>
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
                              size="small"
                              onClick={() => handleDeleteField(field.id)}
                              sx={{
                                p: 0.5,
                                color: '#999',
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
                        <CatalogFieldDisplay
                          catalogId={field.catalogId}
                          catalogName={field.catalogName || field.name}
                          value={(() => {
                            const catalog = field.catalogId ? getCatalog(field.catalogId) : undefined;
                            const isMulti = catalog?.isMultiple || field.isCatalogMultiple;
                            const val = fieldValues[field.id];
                            if (val === undefined || val === null) return isMulti ? [] : '';
                            if (Array.isArray(val)) return val;
                            return String(val);
                          })()}
                          onChange={(val) => handleFieldValueChange(field.id, val)}
                          multiple={(() => {
                            const catalog = field.catalogId ? getCatalog(field.catalogId) : undefined;
                            return catalog?.isMultiple || field.isCatalogMultiple;
                          })()}
                          onCreateNew={(() => {
                            const catalog = field.catalogId ? getCatalog(field.catalogId) : undefined;
                            return catalog?.isEditable
                              ? () => handleCreateNewCatalogEntry(field.id, field.catalogId!)
                              : undefined;
                          })()}
                          onEdit={(() => {
                            const catalog = field.catalogId ? getCatalog(field.catalogId) : undefined;
                            return catalog?.isEditable
                              ? (entryId: string, catId: string) => handleEditCatalogEntry(entryId, catId)
                              : undefined;
                          })()}
                        />
                      </Box>
                    );
                  }

                  // Для остальных типов - простое текстовое поле с кнопкой удаления
                  return (
                    <Box key={field.id} sx={{ mb: 2 }}>
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
                            size="small"
                            onClick={() => handleDeleteField(field.id)}
                            sx={{
                              p: 0.5,
                              color: '#999',
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
