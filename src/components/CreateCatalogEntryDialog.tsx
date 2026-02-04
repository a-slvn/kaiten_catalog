import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Chip,
  InputAdornment,
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Link as LinkIcon,
  Numbers as NumbersIcon,
  Contacts as ContactsIcon,
  FolderOpen as FolderOpenIcon,
} from '@mui/icons-material';
import { useCatalogs } from '../context/CatalogsContext';
import { useReferenceEntries } from '../context/ReferenceEntriesContext';
import { Catalog, CatalogEntry, CatalogFieldDef, CatalogFieldValue, ReferenceEntry } from '../types';

interface CreateCatalogEntryDialogProps {
  open: boolean;
  onClose: () => void;
  catalog?: Catalog;
  catalogId?: string | null;
  editingEntryId?: string | null;
  onCreate?: (entryId: string) => void;
  onUpdate?: () => void;
  editMode?: boolean;
  entryToEdit?: CatalogEntry;
}

interface FieldValues {
  [fieldId: string]: string | string[] | number | null;
}

export const CreateCatalogEntryDialog = ({
  open,
  onClose,
  catalog: catalogProp,
  catalogId,
  editingEntryId,
  onCreate,
  onUpdate,
  editMode,
  entryToEdit,
}: CreateCatalogEntryDialogProps) => {
  const { addEntry, updateEntry, getEntry, getCatalog, getEntriesByCatalog } = useCatalogs();
  const { getEntriesByReference } = useReferenceEntries();

  const [fieldValues, setFieldValues] = useState<FieldValues>({});

  // Получаем каталог либо из пропса, либо по ID
  const catalog = catalogProp || (catalogId ? getCatalog(catalogId) : undefined);

  // ID записи для редактирования
  const entryIdToEdit = editingEntryId || (editMode && entryToEdit?.id) || null;

  // Инициализация значений при открытии диалога
  useEffect(() => {
    if (!catalog) return;

    // Используем entryToEdit если передан напрямую, иначе загружаем по ID
    const entryToUse = entryToEdit || (entryIdToEdit ? getEntry(entryIdToEdit) : null);

    if (entryToUse) {
      const values: FieldValues = {};
      entryToUse.fields.forEach((f) => {
        values[f.fieldId] = f.value;
      });
      setFieldValues(values);
    } else {
      // Инициализация пустыми значениями
      const initialValues: FieldValues = {};
      catalog.fields.forEach((field) => {
        if (field.type === 'multiselect' || (field.type === 'reference' && field.multiple) || (field.type === 'catalog_ref' && field.multiple)) {
          initialValues[field.id] = [];
        } else if (field.type === 'numeric') {
          initialValues[field.id] = null;
        } else {
          initialValues[field.id] = '';
        }
      });
      setFieldValues(initialValues);
    }
  }, [entryIdToEdit, entryToEdit, catalog, getEntry, open]);

  const handleFieldChange = (fieldId: string, value: string | string[] | number | null) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSave = () => {
    if (!catalog) return;

    // Валидация обязательных полей
    for (const field of catalog.fields) {
      if (field.required) {
        const value = fieldValues[field.id];
        if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
          alert(`Поле "${field.name}" обязательно для заполнения`);
          return;
        }
      }
    }

    // Определяем displayValue из первого обязательного поля или первого поля
    const firstRequiredField = catalog.fields.find((f) => f.required);
    const displayFieldId = firstRequiredField?.id || catalog.fields[0]?.id;
    const displayValue = displayFieldId
      ? String(fieldValues[displayFieldId] || 'Без названия')
      : 'Без названия';

    // Формируем массив значений полей
    const fields: CatalogFieldValue[] = catalog.fields.map((fieldDef) => ({
      fieldId: fieldDef.id,
      value: fieldValues[fieldDef.id] ?? null,
    }));

    if (entryIdToEdit) {
      updateEntry(entryIdToEdit, {
        displayValue,
        fields,
      });
      onUpdate?.();
    } else {
      const newEntryId = addEntry({
        catalogId: catalog.id,
        displayValue,
        fields,
      });
      onCreate?.(newEntryId);
    }

    onClose();
  };

  // Рендер поля в зависимости от типа
  const renderField = (fieldDef: CatalogFieldDef) => {
    const value = fieldValues[fieldDef.id];

    switch (fieldDef.type) {
      case 'text':
        return (
          <TextField
            label={fieldDef.name}
            value={value || ''}
            onChange={(e) => handleFieldChange(fieldDef.id, e.target.value)}
            fullWidth
            required={fieldDef.required}
            size="small"
          />
        );

      case 'email':
        return (
          <TextField
            label={fieldDef.name}
            type="email"
            value={value || ''}
            onChange={(e) => handleFieldChange(fieldDef.id, e.target.value)}
            fullWidth
            required={fieldDef.required}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon sx={{ color: '#999', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
        );

      case 'phone':
        return (
          <TextField
            label={fieldDef.name}
            type="tel"
            value={value || ''}
            onChange={(e) => handleFieldChange(fieldDef.id, e.target.value)}
            fullWidth
            required={fieldDef.required}
            size="small"
            placeholder="+7 (999) 123-45-67"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon sx={{ color: '#999', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
        );

      case 'url':
        return (
          <TextField
            label={fieldDef.name}
            type="url"
            value={value || ''}
            onChange={(e) => handleFieldChange(fieldDef.id, e.target.value)}
            fullWidth
            required={fieldDef.required}
            size="small"
            placeholder="https://example.com"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LinkIcon sx={{ color: '#999', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
        );

      case 'numeric':
        return (
          <TextField
            label={fieldDef.name}
            type="number"
            value={value ?? ''}
            onChange={(e) => {
              const numValue = e.target.value === '' ? null : Number(e.target.value);
              handleFieldChange(fieldDef.id, numValue);
            }}
            fullWidth
            required={fieldDef.required}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <NumbersIcon sx={{ color: '#999', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
        );

      case 'select':
        return (
          <FormControl fullWidth size="small" required={fieldDef.required}>
            <InputLabel>{fieldDef.name}</InputLabel>
            <Select
              value={value || ''}
              label={fieldDef.name}
              onChange={(e) => handleFieldChange(fieldDef.id, e.target.value)}
            >
              <MenuItem value="">
                <em>Не выбрано</em>
              </MenuItem>
              {fieldDef.options?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'multiselect':
        return (
          <Autocomplete
            multiple
            options={fieldDef.options || []}
            value={(value as string[]) || []}
            onChange={(_, newValue) => handleFieldChange(fieldDef.id, newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={fieldDef.name}
                size="small"
                required={fieldDef.required}
              />
            )}
            renderTags={(tagValue, getTagProps) =>
              tagValue.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option}
                  label={option}
                  size="small"
                  sx={{ backgroundColor: '#e3f2fd' }}
                />
              ))
            }
          />
        );

      case 'reference':
        return (
          <ReferenceFieldInput
            fieldDef={fieldDef}
            value={value}
            onChange={(newValue) => handleFieldChange(fieldDef.id, newValue)}
            getEntriesByReference={getEntriesByReference}
          />
        );

      case 'catalog_ref':
        return (
          <CatalogRefFieldInput
            fieldDef={fieldDef}
            value={value}
            onChange={(newValue) => handleFieldChange(fieldDef.id, newValue)}
            getEntriesByCatalog={getEntriesByCatalog}
            getCatalog={getCatalog}
          />
        );

      default:
        return (
          <TextField
            label={fieldDef.name}
            value={value || ''}
            onChange={(e) => handleFieldChange(fieldDef.id, e.target.value)}
            fullWidth
            required={fieldDef.required}
            size="small"
          />
        );
    }
  };

  // Если каталог не найден, не рендерим диалог
  if (!catalog) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {entryIdToEdit ? 'Редактировать запись' : `Добавить в "${catalog.name}"`}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          {catalog.fields.map((fieldDef) => (
            <Box key={fieldDef.id} sx={{ mb: 2 }}>
              {renderField(fieldDef)}
            </Box>
          ))}

          {catalog.fields.length === 0 && (
            <Typography variant="body2" sx={{ color: '#999', textAlign: 'center', py: 4 }}>
              В каталоге не определены поля
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
          disabled={catalog.fields.length === 0}
          sx={{
            backgroundColor: '#1976D2',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#1565C0',
            },
          }}
        >
          {entryIdToEdit ? 'Сохранить' : 'Добавить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Компонент для поля типа reference
interface ReferenceFieldInputProps {
  fieldDef: CatalogFieldDef;
  value: string | string[] | number | null;
  onChange: (value: string | string[]) => void;
  getEntriesByReference: (referenceId: string) => ReferenceEntry[];
}

const ReferenceFieldInput = ({
  fieldDef,
  value,
  onChange,
  getEntriesByReference,
}: ReferenceFieldInputProps) => {
  const referenceEntries = fieldDef.referenceId
    ? getEntriesByReference(fieldDef.referenceId)
    : [];

  const isMultiple = fieldDef.multiple;

  // Находим выбранные записи
  const selectedEntries = referenceEntries.filter((entry) => {
    if (Array.isArray(value)) {
      return value.includes(entry.id);
    }
    return entry.id === value;
  });

  if (isMultiple) {
    return (
      <Autocomplete
        multiple
        options={referenceEntries}
        value={selectedEntries}
        onChange={(_, newValue) => onChange(newValue.map((e) => e.id))}
        getOptionLabel={(option) => option.displayValue}
        isOptionEqualToValue={(option, val) => option.id === val.id}
        renderInput={(params) => (
          <TextField
            {...params}
            label={fieldDef.name}
            size="small"
            required={fieldDef.required}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <InputAdornment position="start">
                    <ContactsIcon sx={{ color: '#999', fontSize: 20 }} />
                  </InputAdornment>
                  {params.InputProps.startAdornment}
                </>
              ),
            }}
          />
        )}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              key={option.id}
              label={option.displayValue}
              size="small"
              sx={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}
            />
          ))
        }
        noOptionsText={
          referenceEntries.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#999', p: 1 }}>
              Нет записей в справочнике "{fieldDef.referenceName}"
            </Typography>
          ) : (
            'Не найдено'
          )
        }
      />
    );
  }

  return (
    <Autocomplete
      options={referenceEntries}
      value={selectedEntries[0] || null}
      onChange={(_, newValue) => onChange(newValue ? newValue.id : '')}
      getOptionLabel={(option) => option.displayValue}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      renderInput={(params) => (
        <TextField
          {...params}
          label={fieldDef.name}
          size="small"
          required={fieldDef.required}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <InputAdornment position="start">
                  <ContactsIcon sx={{ color: '#999', fontSize: 20 }} />
                </InputAdornment>
                {params.InputProps.startAdornment}
              </>
            ),
          }}
        />
      )}
      noOptionsText={
        referenceEntries.length === 0 ? (
          <Typography variant="body2" sx={{ color: '#999', p: 1 }}>
            Нет записей в справочнике "{fieldDef.referenceName}"
          </Typography>
        ) : (
          'Не найдено'
        )
      }
    />
  );
};

// Компонент для поля типа catalog_ref
interface CatalogRefFieldInputProps {
  fieldDef: CatalogFieldDef;
  value: string | string[] | number | null;
  onChange: (value: string | string[]) => void;
  getEntriesByCatalog: (catalogId: string) => CatalogEntry[];
  getCatalog: (id: string) => Catalog | undefined;
}

const CatalogRefFieldInput = ({
  fieldDef,
  value,
  onChange,
  getEntriesByCatalog,
  getCatalog,
}: CatalogRefFieldInputProps) => {
  const targetCatalog = fieldDef.targetCatalogId
    ? getCatalog(fieldDef.targetCatalogId)
    : undefined;

  const catalogEntries = fieldDef.targetCatalogId
    ? getEntriesByCatalog(fieldDef.targetCatalogId)
    : [];

  const isMultiple = targetCatalog?.isMultiple || fieldDef.multiple;

  // Находим выбранные записи
  const selectedEntries = catalogEntries.filter((entry) => {
    if (Array.isArray(value)) {
      return value.includes(entry.id);
    }
    return entry.id === value;
  });

  const catalogLabel = targetCatalog
    ? `${fieldDef.name} (${targetCatalog.name})`
    : fieldDef.name;

  const noOptionsMessage = !targetCatalog ? (
    <Typography variant="body2" sx={{ color: '#d32f2f', p: 1 }}>
      Каталог удалён
    </Typography>
  ) : catalogEntries.length === 0 ? (
    <Typography variant="body2" sx={{ color: '#999', p: 1 }}>
      Нет записей в каталоге "{targetCatalog.name}"
    </Typography>
  ) : (
    'Не найдено'
  );

  if (isMultiple) {
    return (
      <Autocomplete
        multiple
        options={catalogEntries}
        value={selectedEntries}
        onChange={(_, newValue) => onChange(newValue.map((e) => e.id))}
        getOptionLabel={(option) => option.displayValue}
        isOptionEqualToValue={(option, val) => option.id === val.id}
        renderInput={(params) => (
          <TextField
            {...params}
            label={catalogLabel}
            size="small"
            required={fieldDef.required}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <InputAdornment position="start">
                    <FolderOpenIcon sx={{ color: '#999', fontSize: 20 }} />
                  </InputAdornment>
                  {params.InputProps.startAdornment}
                </>
              ),
            }}
          />
        )}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              key={option.id}
              label={option.displayValue}
              size="small"
              sx={{ backgroundColor: '#f3e5f5', color: '#7B1FA2' }}
            />
          ))
        }
        noOptionsText={noOptionsMessage}
      />
    );
  }

  return (
    <Autocomplete
      options={catalogEntries}
      value={selectedEntries[0] || null}
      onChange={(_, newValue) => onChange(newValue ? newValue.id : '')}
      getOptionLabel={(option) => option.displayValue}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      renderInput={(params) => (
        <TextField
          {...params}
          label={catalogLabel}
          size="small"
          required={fieldDef.required}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <InputAdornment position="start">
                  <FolderOpenIcon sx={{ color: '#999', fontSize: 20 }} />
                </InputAdornment>
                {params.InputProps.startAdornment}
              </>
            ),
          }}
        />
      )}
      noOptionsText={noOptionsMessage}
    />
  );
};
