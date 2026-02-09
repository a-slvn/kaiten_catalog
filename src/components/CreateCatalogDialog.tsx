import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  Paper,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIndicatorIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useCatalogs } from '../context/CatalogsContext';
import { useCustomFields, CustomFieldDefinition } from '../context/CustomFieldsContext';
import { CatalogFieldDef, CatalogFieldType } from '../types';

interface CreateCatalogDialogProps {
  open: boolean;
  onClose: () => void;
  editingCatalogId?: string | null;
}

const FIELD_TYPE_OPTIONS: { value: CatalogFieldType; label: string }[] = [
  { value: 'text', label: 'Строка' },
  { value: 'url', label: 'Ссылка' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Телефон' },
  { value: 'numeric', label: 'Число' },
  { value: 'catalog_ref', label: 'Каталог' },
];

interface FieldFormData {
  id: string;
  name: string;
  type: CatalogFieldType;
  required: boolean;
  options: string;
  referenceId: string;
  multiple: boolean;
  targetCatalogId: string;
  // Для полей из пользовательских полей
  isCustomFieldSelector?: boolean;  // Режим выбора из существующих пользовательских полей
  customFieldId?: string;           // ID выбранного пользовательского поля
  customFieldType?: string;         // Тип для фильтрации пользовательских полей
}

// Типы пользовательских полей для селектора
const CUSTOM_FIELD_TYPE_OPTIONS: { value: string; label: string; catalogType: CatalogFieldType }[] = [
  { value: 'string', label: 'Строка', catalogType: 'text' },
  { value: 'number', label: 'Число', catalogType: 'numeric' },
  { value: 'select', label: 'Селект', catalogType: 'select' },
  { value: 'multiselect', label: 'Мультиселект', catalogType: 'multiselect' },
  { value: 'reference', label: 'Справочник', catalogType: 'reference' },
];

// Маппинг типов CustomFieldDefinition -> CatalogFieldType
const mapCustomFieldType = (type: CustomFieldDefinition['type']): CatalogFieldType => {
  switch (type) {
    case 'string':
      return 'text';
    case 'number':
      return 'numeric';
    case 'catalog':
      return 'catalog_ref';
    case 'reference':
    case 'select':
    case 'multiselect':
      return type;
    case 'date':
      return 'text'; // date не поддерживается в каталогах напрямую
    default:
      return 'text';
  }
};

const createEmptyField = (isCustomFieldSelector = false): FieldFormData => ({
  id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  name: '',
  type: 'text',
  required: false,
  options: '',
  referenceId: '',
  multiple: false,
  targetCatalogId: '',
  isCustomFieldSelector,
  customFieldId: '',
  customFieldType: isCustomFieldSelector ? 'string' : undefined,
});

export const CreateCatalogDialog = ({
  open,
  onClose,
  editingCatalogId,
}: CreateCatalogDialogProps) => {
  const { addCatalog, updateCatalog, getCatalog, catalogs, getEntriesByCatalog } = useCatalogs();
  const { fieldDefinitions } = useCustomFields();

  const [catalogName, setCatalogName] = useState('');
  const [isMultiple, setIsMultiple] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [fields, setFields] = useState<FieldFormData[]>([createEmptyField()]);

  // Состояния для меню добавления поля
  const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(null);

  // Получаем список справочников для выбора
  const referenceOptions = fieldDefinitions.filter((def) => def.type === 'reference' && def.active);

  // Получаем ID пользовательских полей, уже добавленных в каталог
  const addedCustomFieldIds = useMemo(() => {
    return new Set(fields.filter(f => f.customFieldId).map(f => f.customFieldId));
  }, [fields]);

  // Обработчики меню
  const handleOpenAddMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAddMenuAnchor(event.currentTarget);
  };

  const handleCloseAddMenu = () => {
    setAddMenuAnchor(null);
  };

  // Добавить поле в режиме выбора пользовательского поля
  const handleAddCustomFieldSelector = () => {
    handleCloseAddMenu();
    setFields([...fields, createEmptyField(true)]);
  };

  // Обработка выбора конкретного пользовательского поля
  const handleSelectCustomField = (index: number, customFieldId: string) => {
    const field = fields[index];
    if (isFieldLocked(field.id)) return;

    const customField = fieldDefinitions.find(f => f.id === customFieldId);
    if (!customField) return;

    const newFields = [...fields];
    newFields[index] = {
      ...newFields[index],
      customFieldId: customField.id,
      name: customField.name,
      type: mapCustomFieldType(customField.type),
      referenceId: customField.type === 'reference' && customField.referenceFields?.[0]?.targetReferenceId
        ? customField.referenceFields[0].targetReferenceId
        : '',
      multiple: customField.isMultipleSelection || false,
      targetCatalogId: customField.catalogId || '',
    };
    setFields(newFields);
  };

  // Получаем ID полей, которые имеют заполненные значения в записях каталога
  const filledFieldIds = new Set<string>();
  if (editingCatalogId) {
    const entries = getEntriesByCatalog(editingCatalogId);
    entries.forEach((entry) => {
      entry.fields.forEach((fieldValue) => {
        const value = fieldValue.value;
        const hasValue =
          value !== null &&
          value !== '' &&
          !(Array.isArray(value) && value.length === 0);
        if (hasValue) {
          filledFieldIds.add(fieldValue.fieldId);
        }
      });
    });
  }

  // Проверка, можно ли редактировать/удалять поле
  const isFieldLocked = (fieldId: string): boolean => {
    return filledFieldIds.has(fieldId);
  };

  // Загрузка данных при редактировании
  useEffect(() => {
    if (editingCatalogId) {
      const catalog = getCatalog(editingCatalogId);
      if (catalog) {
        setCatalogName(catalog.name);
        setIsMultiple(catalog.isMultiple || false);
        setIsEditable(catalog.isEditable || false);
        setFields(
          catalog.fields.map((f) => ({
            id: f.id,
            name: f.name,
            type: f.type,
            required: f.required,
            options: f.options?.join(', ') || '',
            referenceId: f.referenceId || '',
            multiple: f.multiple || false,
            targetCatalogId: f.targetCatalogId || '',
            // Восстанавливаем информацию о пользовательском поле
            isCustomFieldSelector: !!f.customFieldId,
            customFieldId: f.customFieldId || '',
          }))
        );
      }
    } else {
      setCatalogName('');
      setIsMultiple(false);
      setIsEditable(false);
      setFields([createEmptyField()]);
    }
  }, [editingCatalogId, getCatalog, open]);

  const handleAddField = () => {
    handleCloseAddMenu();
    setFields([...fields, createEmptyField()]);
  };

  const handleRemoveField = (index: number) => {
    const field = fields[index];
    if (fields.length > 1 && !isFieldLocked(field.id)) {
      setFields(fields.filter((_, i) => i !== index));
    }
  };

  const handleFieldChange = (index: number, key: keyof FieldFormData, value: any) => {
    const field = fields[index];

    // Блокируем изменение типа и связанных настроек для заполненных полей
    if (isFieldLocked(field.id)) {
      const lockedKeys: (keyof FieldFormData)[] = ['type', 'options', 'referenceId', 'targetCatalogId', 'multiple'];
      if (lockedKeys.includes(key)) {
        return;
      }
    }

    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };

    // Сбрасываем options при смене типа на не-select
    if (key === 'type' && value !== 'select' && value !== 'multiselect') {
      newFields[index].options = '';
    }
    // Сбрасываем referenceId при смене типа на не-reference
    if (key === 'type' && value !== 'reference') {
      newFields[index].referenceId = '';
    }
    // Сбрасываем targetCatalogId при смене типа на не-catalog_ref
    if (key === 'type' && value !== 'catalog_ref') {
      newFields[index].targetCatalogId = '';
    }
    // Сбрасываем multiple при смене на тип без множественного выбора
    if (key === 'type' && value !== 'reference' && value !== 'catalog_ref') {
      newFields[index].multiple = false;
    }

    setFields(newFields);
  };

  const handleSave = () => {
    if (!catalogName.trim()) {
      alert('Введите название каталога');
      return;
    }

    // Для пользовательских полей проверяем что выбрано поле
    const hasIncompleteCustomField = fields.some(
      (f) => f.isCustomFieldSelector && !f.customFieldId
    );
    if (hasIncompleteCustomField) {
      alert('Выберите пользовательское поле или удалите пустой блок');
      return;
    }

    const validFields = fields.filter((f) => f.name.trim());
    if (validFields.length === 0) {
      alert('Добавьте хотя бы одно поле');
      return;
    }

    // Проверяем, что для reference полей выбран справочник
    const hasInvalidReference = validFields.some(
      (f) => f.type === 'reference' && !f.referenceId
    );
    if (hasInvalidReference) {
      alert('Выберите справочник для всех полей типа "Справочник"');
      return;
    }

    // Проверяем, что для catalog_ref полей выбран каталог
    const hasInvalidCatalogRef = validFields.some(
      (f) => f.type === 'catalog_ref' && !f.targetCatalogId
    );
    if (hasInvalidCatalogRef) {
      alert('Выберите каталог для всех полей типа "Каталог"');
      return;
    }

    const catalogFields: CatalogFieldDef[] = validFields.map((f) => {
      const refDef = referenceOptions.find((r) => r.id === f.referenceId);
      return {
        id: f.id,
        name: f.name.trim(),
        type: f.type,
        required: f.required,
        // Сохраняем ID пользовательского поля если есть
        ...(f.customFieldId ? { customFieldId: f.customFieldId } : {}),
        ...(f.type === 'select' || f.type === 'multiselect'
          ? {
              options: f.options
                .split(',')
                .map((o) => o.trim())
                .filter(Boolean),
            }
          : {}),
        ...(f.type === 'reference'
          ? {
              referenceId: f.referenceId,
              referenceName: refDef?.name || '',
              multiple: f.multiple,
            }
          : {}),
        ...(f.type === 'catalog_ref'
          ? {
              targetCatalogId: f.targetCatalogId,
              targetCatalogName: catalogs.find((c) => c.id === f.targetCatalogId)?.name || '',
              multiple: f.multiple,
            }
          : {}),
      };
    });

    if (editingCatalogId) {
      updateCatalog(editingCatalogId, {
        name: catalogName.trim(),
        fields: catalogFields,
        isMultiple,
        isEditable,
      });
    } else {
      addCatalog({
        name: catalogName.trim(),
        fields: catalogFields,
        isMultiple,
        isEditable,
      });
    }

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editingCatalogId ? 'Редактировать каталог' : 'Создать каталог'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          {/* Название каталога */}
          <TextField
            label="Название каталога"
            value={catalogName}
            onChange={(e) => setCatalogName(e.target.value)}
            fullWidth
            required
            sx={{ mb: 3 }}
          />

          {/* Опции каталога */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isMultiple}
                  onChange={(e) => setIsMultiple(e.target.checked)}
                  size="small"
                />
              }
              label="Множественный выбор (можно выбрать несколько записей)"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={isEditable}
                  onChange={(e) => setIsEditable(e.target.checked)}
                  size="small"
                />
              }
              label="Разрешить редактирование записей"
            />
          </Box>

          {/* Поля каталога */}
          <Typography variant="subtitle2" sx={{ mb: 2, color: '#666' }}>
            Поля каталога
          </Typography>

          {fields.map((field, index) => {
            const locked = isFieldLocked(field.id);
            const isCustomSelector = field.isCustomFieldSelector;

            // Получаем доступные пользовательские поля (без типа catalog — он добавляется через "Поле каталога")
            const allCustomFields = fieldDefinitions.filter(f => f.active && f.type !== 'catalog');

            // Получаем информацию о выбранном поле для отображения
            const selectedCustomField = field.customFieldId
              ? fieldDefinitions.find(f => f.id === field.customFieldId)
              : null;

            return (
              <Paper
                key={field.id}
                elevation={0}
                sx={{
                  p: 2,
                  mb: 2,
                  border: '1px solid',
                  borderColor: '#e0e0e0',
                  borderRadius: 2,
                  backgroundColor: '#fafafa',
                  position: 'relative',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <DragIndicatorIcon sx={{ color: '#ccc', mt: 1 }} />

                  <Box sx={{ flex: 1 }}>
                    {/* UI для выбора пользовательского поля */}
                    {isCustomSelector ? (
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        {/* Autocomplete с поиском */}
                        <Autocomplete
                          size="small"
                          sx={{ flex: 1 }}
                          disabled={locked}
                          options={allCustomFields}
                          value={selectedCustomField || null}
                          onChange={(_, newValue) => {
                            if (newValue) {
                              handleSelectCustomField(index, newValue.id);
                            }
                          }}
                          getOptionLabel={(option) => option.name}
                          getOptionDisabled={(option) =>
                            addedCustomFieldIds.has(option.id) && option.id !== field.customFieldId
                          }
                          groupBy={(option) =>
                            CUSTOM_FIELD_TYPE_OPTIONS.find(t => t.value === option.type)?.label || option.type
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <LinkIcon sx={{ fontSize: '1rem' }} />
                                  Пользовательское поле
                                </Box>
                              }
                              placeholder="Начните вводить название"
                            />
                          )}
                          renderOption={(props, option) => {
                            const isAlreadyAdded = addedCustomFieldIds.has(option.id) && option.id !== field.customFieldId;
                            return (
                              <li {...props} key={option.id}>
                                <Box sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  width: '100%',
                                  opacity: isAlreadyAdded ? 0.5 : 1,
                                }}>
                                  <span>{option.name}</span>
                                  {isAlreadyAdded && (
                                    <Typography variant="caption" color="text.secondary">
                                      уже добавлено
                                    </Typography>
                                  )}
                                </Box>
                              </li>
                            );
                          }}
                          renderGroup={(params) => (
                            <li key={params.key}>
                              <Box
                                sx={{
                                  position: 'sticky',
                                  top: '-8px',
                                  padding: '8px 16px',
                                  backgroundColor: '#f5f5f5',
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  color: '#666',
                                }}
                              >
                                {params.group}
                              </Box>
                              <ul style={{ padding: 0 }}>{params.children}</ul>
                            </li>
                          )}
                          noOptionsText="Нет доступных полей"
                          isOptionEqualToValue={(option, value) => option.id === value.id}
                        />

                        {/* Обязательное */}
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={field.required}
                              onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                              size="small"
                            />
                          }
                          label="Обязательное"
                          sx={{ minWidth: 'auto', mr: 0 }}
                        />
                      </Box>
                    ) : (
                      /* Стандартный UI для нового поля */
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Название поля */}
                        <TextField
                          label="Название поля"
                          value={field.name}
                          onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                          size="small"
                          sx={{ flex: 1, minWidth: 150 }}
                        />

                        {/* Тип поля */}
                        <Tooltip title={locked ? 'Нельзя изменить тип — поле содержит данные' : ''}>
                          <FormControl size="small" sx={{ minWidth: 130 }}>
                            <InputLabel>Тип</InputLabel>
                            <Select
                              value={field.type}
                              label="Тип"
                              onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                              disabled={locked}
                            >
                              {FIELD_TYPE_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Tooltip>

                        {/* Inline выбор справочника для reference */}
                        {field.type === 'reference' && (
                          <>
                            <Tooltip title={locked ? 'Нельзя изменить справочник — поле содержит данные' : ''}>
                              <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>Справочник</InputLabel>
                                <Select
                                  value={field.referenceId}
                                  label="Справочник"
                                  onChange={(e) => handleFieldChange(index, 'referenceId', e.target.value)}
                                  disabled={locked}
                                >
                                  {referenceOptions.length === 0 ? (
                                    <MenuItem disabled value="">
                                      Нет доступных
                                    </MenuItem>
                                  ) : (
                                    referenceOptions.map((ref) => (
                                      <MenuItem key={ref.id} value={ref.id}>
                                        {ref.name}
                                      </MenuItem>
                                    ))
                                  )}
                                </Select>
                              </FormControl>
                            </Tooltip>
                            <Tooltip title={locked ? 'Нельзя изменить — поле содержит данные' : ''}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={field.multiple}
                                    onChange={(e) => handleFieldChange(index, 'multiple', e.target.checked)}
                                    size="small"
                                    disabled={locked}
                                  />
                                }
                                label="Множеств."
                                sx={{ mr: 0 }}
                              />
                            </Tooltip>
                          </>
                        )}

                        {/* Inline выбор каталога для catalog_ref */}
                        {field.type === 'catalog_ref' && (
                          <Tooltip title={locked ? 'Нельзя изменить каталог — поле содержит данные' : ''}>
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                              <InputLabel>Каталог</InputLabel>
                              <Select
                                value={field.targetCatalogId}
                                label="Каталог"
                                onChange={(e) => handleFieldChange(index, 'targetCatalogId', e.target.value)}
                                disabled={locked}
                              >
                                {catalogs.length === 0 ? (
                                  <MenuItem disabled value="">
                                    Нет доступных
                                  </MenuItem>
                                ) : (
                                  catalogs.map((cat) => (
                                    <MenuItem key={cat.id} value={cat.id}>
                                      {cat.name}
                                    </MenuItem>
                                  ))
                                )}
                              </Select>
                            </FormControl>
                          </Tooltip>
                        )}

                        {/* Обязательное */}
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={field.required}
                              onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                              size="small"
                            />
                          }
                          label="Обязательное"
                          sx={{ minWidth: 'auto', mr: 0 }}
                        />
                      </Box>
                    )}

                    {/* Дополнительные настройки только для новых полей (не пользовательских) */}
                    {!isCustomSelector && (
                      <>
                        {/* Опции для select/multiselect */}
                        {(field.type === 'select' || field.type === 'multiselect') && (
                          <Tooltip title={locked ? 'Нельзя изменить варианты — поле содержит данные' : ''}>
                            <TextField
                              label="Варианты (через запятую)"
                              value={field.options}
                              onChange={(e) => handleFieldChange(index, 'options', e.target.value)}
                              size="small"
                              fullWidth
                              placeholder="Вариант 1, Вариант 2, Вариант 3"
                              disabled={locked}
                              sx={{ mb: 1 }}
                            />
                          </Tooltip>
                        )}
                      </>
                    )}
                  </Box>

                  {/* Кнопка удаления */}
                  <Tooltip title={locked ? 'Нельзя удалить — поле содержит данные' : ''}>
                    <span>
                      <IconButton
                        onClick={() => handleRemoveField(index)}
                        disabled={fields.length === 1 || locked}
                        sx={{ color: locked ? '#ccc' : '#d32f2f' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Paper>
            );
          })}

          {/* Кнопка добавления поля с меню */}
          <Button
            startIcon={<AddIcon />}
            endIcon={<ArrowDropDownIcon />}
            onClick={handleOpenAddMenu}
            sx={{
              color: '#7B1FA2',
              textTransform: 'none',
            }}
          >
            Добавить поле
          </Button>

          {/* Dropdown меню */}
          <Menu
            anchorEl={addMenuAnchor}
            open={Boolean(addMenuAnchor)}
            onClose={handleCloseAddMenu}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            PaperProps={{
              sx: {
                minWidth: 200,
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                mt: 1,
              },
            }}
          >
            <MenuItem onClick={handleAddField}>
              <ListItemIcon>
                <AddIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Поле каталога" />
            </MenuItem>
            <MenuItem
              onClick={handleAddCustomFieldSelector}
              disabled={fieldDefinitions.filter(f => f.active).length === 0}
            >
              <ListItemIcon>
                <LinkIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Пользовательское поле"
                secondary={fieldDefinitions.filter(f => f.active).length === 0 ? 'Нет доступных полей' : undefined}
              />
            </MenuItem>
          </Menu>

          {referenceOptions.length === 0 && (
            <Typography variant="caption" sx={{ display: 'block', mt: 2, color: '#f57c00' }}>
              Для использования полей типа "Справочник" сначала создайте справочники
              в разделе "Пользовательские поля".
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Отмена
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          sx={{
            backgroundColor: '#7B1FA2',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#6A1B9A',
            },
          }}
        >
          {editingCatalogId ? 'Сохранить' : 'Создать'}
        </Button>
      </DialogActions>

    </Dialog>
  );
};
