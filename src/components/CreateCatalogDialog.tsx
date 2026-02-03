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
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIndicatorIcon,
} from '@mui/icons-material';
import { useCatalogs } from '../context/CatalogsContext';
import { useCustomFields } from '../context/CustomFieldsContext';
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
  { value: 'select', label: 'Селект' },
  { value: 'multiselect', label: 'Мультиселект' },
  { value: 'numeric', label: 'Число' },
  { value: 'reference', label: 'Справочник' },
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
}

const createEmptyField = (): FieldFormData => ({
  id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  name: '',
  type: 'text',
  required: false,
  options: '',
  referenceId: '',
  multiple: false,
  targetCatalogId: '',
});

export const CreateCatalogDialog = ({
  open,
  onClose,
  editingCatalogId,
}: CreateCatalogDialogProps) => {
  const { addCatalog, updateCatalog, getCatalog, catalogs } = useCatalogs();
  const { fieldDefinitions } = useCustomFields();

  const [catalogName, setCatalogName] = useState('');
  const [fields, setFields] = useState<FieldFormData[]>([createEmptyField()]);

  // Получаем список справочников для выбора
  const referenceOptions = fieldDefinitions.filter((def) => def.type === 'reference' && def.active);

  // Загрузка данных при редактировании
  useEffect(() => {
    if (editingCatalogId) {
      const catalog = getCatalog(editingCatalogId);
      if (catalog) {
        setCatalogName(catalog.name);
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
          }))
        );
      }
    } else {
      setCatalogName('');
      setFields([createEmptyField()]);
    }
  }, [editingCatalogId, getCatalog, open]);

  const handleAddField = () => {
    setFields([...fields, createEmptyField()]);
  };

  const handleRemoveField = (index: number) => {
    if (fields.length > 1) {
      setFields(fields.filter((_, i) => i !== index));
    }
  };

  const handleFieldChange = (index: number, key: keyof FieldFormData, value: any) => {
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
      });
    } else {
      addCatalog({
        name: catalogName.trim(),
        fields: catalogFields,
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

          {/* Поля каталога */}
          <Typography variant="subtitle2" sx={{ mb: 2, color: '#666' }}>
            Поля каталога
          </Typography>

          {fields.map((field, index) => (
            <Paper
              key={field.id}
              elevation={0}
              sx={{
                p: 2,
                mb: 2,
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                backgroundColor: '#fafafa',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <DragIndicatorIcon sx={{ color: '#ccc', mt: 1 }} />

                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    {/* Название поля */}
                    <TextField
                      label="Название поля"
                      value={field.name}
                      onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                      size="small"
                      sx={{ flex: 1 }}
                    />

                    {/* Тип поля */}
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Тип</InputLabel>
                      <Select
                        value={field.type}
                        label="Тип"
                        onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                      >
                        {FIELD_TYPE_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

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
                    />
                  </Box>

                  {/* Опции для select/multiselect */}
                  {(field.type === 'select' || field.type === 'multiselect') && (
                    <TextField
                      label="Варианты (через запятую)"
                      value={field.options}
                      onChange={(e) => handleFieldChange(index, 'options', e.target.value)}
                      size="small"
                      fullWidth
                      placeholder="Вариант 1, Вариант 2, Вариант 3"
                      sx={{ mb: 1 }}
                    />
                  )}

                  {/* Выбор справочника для reference */}
                  {field.type === 'reference' && (
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Справочник</InputLabel>
                        <Select
                          value={field.referenceId}
                          label="Справочник"
                          onChange={(e) => handleFieldChange(index, 'referenceId', e.target.value)}
                        >
                          {referenceOptions.length === 0 ? (
                            <MenuItem disabled value="">
                              Нет доступных справочников
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
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={field.multiple}
                            onChange={(e) => handleFieldChange(index, 'multiple', e.target.checked)}
                            size="small"
                          />
                        }
                        label="Множественный выбор"
                      />
                    </Box>
                  )}

                  {/* Выбор каталога для catalog_ref */}
                  {field.type === 'catalog_ref' && (
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Каталог</InputLabel>
                        <Select
                          value={field.targetCatalogId}
                          label="Каталог"
                          onChange={(e) => handleFieldChange(index, 'targetCatalogId', e.target.value)}
                        >
                          {catalogs.length === 0 ? (
                            <MenuItem disabled value="">
                              Нет доступных каталогов
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
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={field.multiple}
                            onChange={(e) => handleFieldChange(index, 'multiple', e.target.checked)}
                            size="small"
                          />
                        }
                        label="Множественный выбор"
                      />
                    </Box>
                  )}
                </Box>

                {/* Кнопка удаления */}
                <IconButton
                  onClick={() => handleRemoveField(index)}
                  disabled={fields.length === 1}
                  sx={{ color: '#d32f2f' }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Paper>
          ))}

          {/* Кнопка добавления поля */}
          <Button
            startIcon={<AddIcon />}
            onClick={handleAddField}
            sx={{
              color: '#7B1FA2',
              textTransform: 'none',
            }}
          >
            Добавить поле
          </Button>

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
