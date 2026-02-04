import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  IconButton,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Alert,
} from '@mui/material';
import {
  Add,
  Delete,
  TextFields as TextIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Chat as MessengerIcon,
  Link as UrlIcon,
  Numbers as NumericIcon,
  List as SelectIcon,
  LocationOn as AddressIcon,
  Notes as TextareaIcon,
  AccountTree as ReferenceIcon,
  CalendarMonth as DateIcon,
  Folder as CatalogIcon,
} from '@mui/icons-material';
import { FieldType } from '../types';
import { CustomFieldDefinition, ReferenceFieldDef, useCustomFields } from '../context/CustomFieldsContext';
import { useCatalogs } from '../context/CatalogsContext';

interface AddCustomFieldModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (field: Omit<CustomFieldDefinition, 'id' | 'createdAt' | 'author' | 'active'>) => void;
  // Режим редактирования
  editMode?: boolean;
  fieldToEdit?: CustomFieldDefinition;
  onUpdate?: (fieldId: string, updates: Partial<CustomFieldDefinition>) => void;
}

const CUSTOM_FIELD_TYPES = [
  { value: 'string', label: 'Строка', icon: <TextIcon fontSize="small" /> },
  { value: 'reference', label: 'Справочник', icon: <ReferenceIcon fontSize="small" /> },
  { value: 'date', label: 'Дата', icon: <DateIcon fontSize="small" /> },
  { value: 'number', label: 'Число', icon: <NumericIcon fontSize="small" /> },
  { value: 'select', label: 'Селект', icon: <SelectIcon fontSize="small" /> },
  { value: 'multiselect', label: 'Мульти селект', icon: <SelectIcon fontSize="small" /> },
  { value: 'catalog', label: 'Каталог', icon: <CatalogIcon fontSize="small" /> },
];

// Типы полей, которые можно добавить в справочник
const REFERENCE_FIELD_TYPES: { type: FieldType; label: string }[] = [
  { type: 'text', label: 'Строка' },
  { type: 'url', label: 'Ссылка' },
  { type: 'email', label: 'Email' },
  { type: 'phone', label: 'Телефон' },
  { type: 'select', label: 'Селект' },
  { type: 'multiselect', label: 'Мульти селект' },
  { type: 'numeric', label: 'Число' },
];

const COLOR_PALETTE = [
  // Row 1
  '#FFCDD2', '#F8BBD9', '#FFCC80', '#CE93D8', '#B39DDB', '#90CAF9', '#80DEEA', '#A5D6A7',
  // Row 2
  '#80CBC4', '#C5E1A5', '#E6EE9C', '#FFF59D', '#FFAB91', '#BCAAA4', '#B0BEC5', '#D7CCC8',
  // Row 3
  '#FFF9C4',
];

const getFieldTypeIcon = (type: FieldType) => {
  switch (type) {
    case 'text':
      return <TextIcon fontSize="small" />;
    case 'email':
      return <EmailIcon fontSize="small" />;
    case 'phone':
      return <PhoneIcon fontSize="small" />;
    case 'messenger':
      return <MessengerIcon fontSize="small" />;
    case 'url':
      return <UrlIcon fontSize="small" />;
    case 'numeric':
      return <NumericIcon fontSize="small" />;
    case 'select':
    case 'multiselect':
      return <SelectIcon fontSize="small" />;
    case 'smart_address':
      return <AddressIcon fontSize="small" />;
    case 'textarea':
      return <TextareaIcon fontSize="small" />;
    case 'reference':
      return <ReferenceIcon fontSize="small" />;
    default:
      return <TextIcon fontSize="small" />;
  }
};

export const AddCustomFieldModal = ({
  open,
  onClose,
  onAdd,
  editMode = false,
  fieldToEdit,
  onUpdate,
}: AddCustomFieldModalProps) => {
  const { fieldDefinitions } = useCustomFields();
  const { catalogs } = useCatalogs();
  const [fieldType, setFieldType] = useState<string>('reference');
  const [fieldName, setFieldName] = useState('');
  const [showOnCardFacade, setShowOnCardFacade] = useState(true);
  const [usersCanAddValues, setUsersCanAddValues] = useState(true);
  const [valuesCanHaveColor, setValuesCanHaveColor] = useState(true);
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [referenceFields, setReferenceFields] = useState<ReferenceFieldDef[]>([
    { id: '1', name: '', type: 'text', required: true },
  ]);
  // Состояние для типа "Каталог"
  const [catalogId, setCatalogId] = useState<string>('');
  const [isCatalogMultiple, setIsCatalogMultiple] = useState(false);
  const [showCatalogChangeWarning, setShowCatalogChangeWarning] = useState(false);
  const [pendingCatalogId, setPendingCatalogId] = useState<string>('');

  // Получить список справочников для выбора в reference полях
  const availableReferences = fieldDefinitions.filter((field) => field.type === 'reference' && field.active);

  // useEffect для загрузки данных при редактировании
  useEffect(() => {
    if (open && editMode && fieldToEdit) {
      // Загружаем данные из fieldToEdit
      setFieldType(fieldToEdit.type);
      setFieldName(fieldToEdit.name);
      setShowOnCardFacade(fieldToEdit.showOnCardFacade);
      setUsersCanAddValues(fieldToEdit.usersCanAddValues);
      setValuesCanHaveColor(fieldToEdit.valuesCanHaveColor);
      setSelectedColor(fieldToEdit.selectedColor);
      setReferenceFields(
        fieldToEdit.referenceFields && fieldToEdit.referenceFields.length > 0
          ? fieldToEdit.referenceFields
          : [{ id: '1', name: '', type: 'text', required: true }]
      );
      setCatalogId(fieldToEdit.catalogId || '');
      setIsCatalogMultiple(fieldToEdit.isCatalogMultiple || false);
    } else if (open && !editMode) {
      // Если открываем в режиме добавления - сбрасываем поля
      setFieldType('reference');
      setFieldName('');
      setShowOnCardFacade(true);
      setUsersCanAddValues(true);
      setValuesCanHaveColor(true);
      setSelectedColor(undefined);
      setReferenceFields([{ id: '1', name: '', type: 'text', required: true }]);
      setCatalogId('');
      setIsCatalogMultiple(false);
    }
  }, [open, editMode, fieldToEdit]);

  const handleAddReferenceField = () => {
    setReferenceFields([
      ...referenceFields,
      { id: Date.now().toString(), name: '', type: 'text', required: false },
    ]);
  };

  const handleRemoveReferenceField = (id: string) => {
    setReferenceFields(referenceFields.filter((f) => f.id !== id));
  };

  const handleReferenceFieldChange = (
    id: string,
    field: keyof ReferenceFieldDef,
    value: string | boolean | FieldType
  ) => {
    setReferenceFields(
      referenceFields.map((f) => {
        if (f.id !== id) return f;

        const updated = { ...f, [field]: value };

        // Если меняем тип поля на 'reference' или 'multiselect', добавляем значения по умолчанию
        if (field === 'type' && (value === 'reference' || value === 'multiselect')) {
          updated.targetReferenceId = updated.targetReferenceId || '';
          updated.targetReferenceName = updated.targetReferenceName || '';
          updated.cascadeFilter = updated.cascadeFilter !== undefined ? updated.cascadeFilter : true;
        }

        // Если меняем тип поля на что-то другое, очищаем reference-специфичные поля
        if (field === 'type' && value !== 'reference' && value !== 'multiselect') {
          delete updated.targetReferenceId;
          delete updated.targetReferenceName;
          delete updated.cascadeFilter;
        }

        // Если меняем targetReferenceId, обновляем также targetReferenceName
        if (field === 'targetReferenceId') {
          const selectedRef = availableReferences.find((ref) => ref.id === value);
          updated.targetReferenceName = selectedRef?.name || '';
        }

        return updated;
      })
    );
  };

  const handleCatalogIdChange = (newCatalogId: string) => {
    // В режиме редактирования, если каталог меняется — показать предупреждение
    if (editMode && fieldToEdit?.catalogId && fieldToEdit.catalogId !== newCatalogId && newCatalogId !== '') {
      setPendingCatalogId(newCatalogId);
      setShowCatalogChangeWarning(true);
    } else {
      setCatalogId(newCatalogId);
    }
  };

  const handleConfirmCatalogChange = () => {
    // Очистить значения этого поля во всех карточках
    if (fieldToEdit) {
      const keysToCheck: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('crm_deal_values_')) {
          keysToCheck.push(key);
        }
      }
      keysToCheck.forEach((key) => {
        try {
          const values = JSON.parse(localStorage.getItem(key) || '{}');
          if (fieldToEdit.id in values) {
            delete values[fieldToEdit.id];
            localStorage.setItem(key, JSON.stringify(values));
          }
        } catch {
          // ignore parse errors
        }
      });
    }
    setCatalogId(pendingCatalogId);
    setShowCatalogChangeWarning(false);
    setPendingCatalogId('');
  };

  const handleCancelCatalogChange = () => {
    setShowCatalogChangeWarning(false);
    setPendingCatalogId('');
  };

  const handleSubmit = () => {
    const selectedCatalog = catalogs.find((c) => c.id === catalogId);
    const fieldData = {
      name: fieldName,
      type: fieldType as CustomFieldDefinition['type'],
      showOnCardFacade,
      usersCanAddValues,
      valuesCanHaveColor,
      selectedColor,
      referenceFields: fieldType === 'reference' ? referenceFields : undefined,
      catalogId: fieldType === 'catalog' ? catalogId : undefined,
      catalogName: fieldType === 'catalog' ? (selectedCatalog?.name || '') : undefined,
      isCatalogMultiple: fieldType === 'catalog' ? isCatalogMultiple : undefined,
    };

    if (editMode && onUpdate && fieldToEdit) {
      // Режим редактирования
      onUpdate(fieldToEdit.id, fieldData);
    } else {
      // Режим добавления
      onAdd(fieldData);
    }
    handleClose();
  };

  const handleClose = () => {
    setFieldType('reference');
    setFieldName('');
    setShowOnCardFacade(true);
    setUsersCanAddValues(true);
    setValuesCanHaveColor(true);
    setSelectedColor(undefined);
    setReferenceFields([{ id: '1', name: '', type: 'text', required: true }]);
    setCatalogId('');
    setIsCatalogMultiple(false);
    setShowCatalogChangeWarning(false);
    setPendingCatalogId('');
    onClose();
  };

  const isValid = fieldName.trim() !== '' && (fieldType !== 'catalog' || catalogId !== '');

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogContent sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#212121' }}>
          {editMode ? 'Редактировать поле' : 'Добавить поле'}
        </Typography>

        {/* Type selector */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel
            sx={{
              color: '#7B1FA2',
              '&.Mui-focused': { color: '#7B1FA2' },
            }}
          >
            Тип
          </InputLabel>
          <Select
            value={fieldType}
            onChange={(e) => setFieldType(e.target.value)}
            label="Тип"
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#7B1FA2',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#7B1FA2',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#7B1FA2',
              },
            }}
            renderValue={(value) => {
              const selected = CUSTOM_FIELD_TYPES.find((t) => t.value === value);
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {selected?.icon}
                  <span>{selected?.label}</span>
                </Box>
              );
            }}
          >
            {CUSTOM_FIELD_TYPES.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {type.icon}
                  <span>{type.label}</span>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Name field */}
        <TextField
          fullWidth
          label="Наименование поля"
          required
          value={fieldName}
          onChange={(e) => setFieldName(e.target.value)}
          sx={{ mb: 3 }}
        />

        <Divider sx={{ mb: 2 }} />

        {/* Checkboxes */}
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={showOnCardFacade}
                onChange={(e) => setShowOnCardFacade(e.target.checked)}
                sx={{
                  color: '#7B1FA2',
                  '&.Mui-checked': { color: '#7B1FA2' },
                }}
              />
            }
            label="Показывать на фасаде карточек"
          />
        </Box>

        {fieldType !== 'catalog' && (
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={usersCanAddValues}
                  onChange={(e) => setUsersCanAddValues(e.target.checked)}
                  sx={{
                    color: '#7B1FA2',
                    '&.Mui-checked': { color: '#7B1FA2' },
                  }}
                />
              }
              label="Пользователи могут добавлять новые значения"
            />
          </Box>
        )}

        {fieldType !== 'catalog' && (
          <>
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={valuesCanHaveColor}
                    onChange={(e) => setValuesCanHaveColor(e.target.checked)}
                    sx={{
                      color: '#7B1FA2',
                      '&.Mui-checked': { color: '#7B1FA2' },
                    }}
                  />
                }
                label="Значениям можно добавлять цвет"
              />
            </Box>

            {/* Color palette */}
            {valuesCanHaveColor && (
              <Box sx={{ mb: 3, ml: 4 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxWidth: 320 }}>
                  {COLOR_PALETTE.map((color) => (
                    <Box
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: color,
                        cursor: 'pointer',
                        border: selectedColor === color ? '3px solid #7B1FA2' : '2px solid transparent',
                        transition: 'border 0.2s',
                        '&:hover': {
                          border: '2px solid #9E9E9E',
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </>
        )}

        {/* Reference fields section - only for 'reference' type */}
        {fieldType === 'reference' && (
          <>
            <Typography variant="subtitle1" sx={{ color: '#757575', mb: 1, mt: 2 }}>
              Поля справочника
            </Typography>

            <Button
              startIcon={<Add />}
              onClick={handleAddReferenceField}
              sx={{
                color: '#7B1FA2',
                textTransform: 'uppercase',
                fontWeight: 500,
                mb: 2,
                '&:hover': {
                  backgroundColor: 'rgba(123, 31, 162, 0.04)',
                },
              }}
            >
              Добавить поле
            </Button>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 500, color: '#757575', width: '40%' }}>
                    Поле
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500, color: '#757575', width: '35%' }}>
                    Тип
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500, color: '#757575', width: '15%' }}>
                    Обязательное
                  </TableCell>
                  <TableCell sx={{ width: '10%' }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {referenceFields.map((field) => (
                  <>
                    <TableRow key={field.id}>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          placeholder="Введите наименование поля"
                          value={field.name}
                          onChange={(e) =>
                            handleReferenceFieldChange(field.id, 'name', e.target.value)
                          }
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: '#E0E0E0',
                              },
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" fullWidth>
                          <Select
                            value={field.type}
                            onChange={(e) =>
                              handleReferenceFieldChange(field.id, 'type', e.target.value as FieldType)
                            }
                            renderValue={(value) => {
                              const fieldDef = REFERENCE_FIELD_TYPES.find((t) => t.type === value);
                              return (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {getFieldTypeIcon(value as FieldType)}
                                  <span>{fieldDef?.label}</span>
                                </Box>
                              );
                            }}
                          >
                            {REFERENCE_FIELD_TYPES.map((type) => (
                              <MenuItem key={type.type} value={type.type}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {getFieldTypeIcon(type.type)}
                                  <span>{type.label}</span>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox
                          checked={field.required}
                          onChange={(e) =>
                            handleReferenceFieldChange(field.id, 'required', e.target.checked)
                          }
                          sx={{
                            color: '#9E9E9E',
                            '&.Mui-checked': { color: '#7B1FA2' },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {referenceFields.length > 1 && (
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveReferenceField(field.id)}
                            sx={{ color: '#9E9E9E' }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Дополнительная строка для настройки reference и multiselect полей */}
                    {(field.type === 'reference' || field.type === 'multiselect') && (
                      <TableRow key={`${field.id}-ref-config`}>
                        <TableCell colSpan={4} sx={{ backgroundColor: '#F5F5F5', py: 2 }}>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', px: 2 }}>
                            <FormControl size="small" sx={{ minWidth: 250 }}>
                              <InputLabel
                                sx={{
                                  color: '#7B1FA2',
                                  '&.Mui-focused': { color: '#7B1FA2' },
                                }}
                              >
                                Целевой справочник
                              </InputLabel>
                              <Select
                                value={field.targetReferenceId || ''}
                                onChange={(e) =>
                                  handleReferenceFieldChange(field.id, 'targetReferenceId', e.target.value)
                                }
                                label="Целевой справочник"
                                sx={{
                                  backgroundColor: '#FFFFFF',
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#7B1FA2',
                                  },
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#7B1FA2',
                                  },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#7B1FA2',
                                  },
                                }}
                              >
                                {availableReferences.length === 0 ? (
                                  <MenuItem disabled value="">
                                    <em>Нет доступных справочников</em>
                                  </MenuItem>
                                ) : (
                                  availableReferences.map((ref) => (
                                    <MenuItem key={ref.id} value={ref.id}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ReferenceIcon fontSize="small" />
                                        <span>{ref.name}</span>
                                      </Box>
                                    </MenuItem>
                                  ))
                                )}
                              </Select>
                            </FormControl>

                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={field.cascadeFilter !== false}
                                  onChange={(e) =>
                                    handleReferenceFieldChange(field.id, 'cascadeFilter', e.target.checked)
                                  }
                                  sx={{
                                    color: '#7B1FA2',
                                    '&.Mui-checked': { color: '#7B1FA2' },
                                  }}
                                />
                              }
                              label="Каскадная фильтрация"
                              sx={{
                                '& .MuiFormControlLabel-label': {
                                  color: '#424242',
                                  fontSize: '0.875rem',
                                },
                              }}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </>
        )}

        {/* Catalog fields section - only for 'catalog' type */}
        {fieldType === 'catalog' && (
          <>
            <Typography variant="subtitle1" sx={{ color: '#757575', mb: 1, mt: 2 }}>
              Настройки каталога
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel
                sx={{
                  color: '#7B1FA2',
                  '&.Mui-focused': { color: '#7B1FA2' },
                }}
              >
                Каталог
              </InputLabel>
              <Select
                value={catalogId}
                onChange={(e) => handleCatalogIdChange(e.target.value)}
                label="Каталог"
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#7B1FA2',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#7B1FA2',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#7B1FA2',
                  },
                }}
              >
                {catalogs.length === 0 ? (
                  <MenuItem disabled value="">
                    <em>Нет доступных каталогов</em>
                  </MenuItem>
                ) : (
                  catalogs.map((catalog) => (
                    <MenuItem key={catalog.id} value={catalog.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CatalogIcon fontSize="small" />
                        <span>{catalog.name}</span>
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </>
        )}

        {/* Catalog change confirmation dialog */}
        <Dialog open={showCatalogChangeWarning} onClose={handleCancelCatalogChange}>
          <DialogTitle>Смена каталога</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mt: 1 }}>
              Смена каталога приведёт к сбросу значений этого поля во всех карточках. Продолжить?
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelCatalogChange} sx={{ color: '#424242' }}>
              Отмена
            </Button>
            <Button onClick={handleConfirmCatalogChange} sx={{ color: '#7B1FA2' }}>
              Продолжить
            </Button>
          </DialogActions>
        </Dialog>

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
          <Button
            onClick={handleClose}
            sx={{
              color: '#424242',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            sx={{
              color: isValid ? '#7B1FA2' : '#BDBDBD',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            {editMode ? 'Сохранить' : 'Добавить'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
