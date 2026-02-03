import {
  Box,
  TextField,
  Button,
  MenuItem,
  IconButton,
  Typography,
  Paper,
  Chip,
  Collapse,
  Divider,
  Autocomplete,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
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
} from '@mui/icons-material';
import { useState } from 'react';
import {
  CustomField,
  FieldType,
  FIELD_TYPES,
  SelectOption,
  ReferenceType,
  ReferenceConfig,
  REFERENCE_TYPES,
  Deal,
} from '../types';
import { useCustomFields } from '../context/CustomFieldsContext';

interface CustomFieldBuilderProps {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
  title?: string;
  deals?: Deal[];
}

const getFieldIcon = (type: FieldType) => {
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

const getFieldPlaceholder = (type: FieldType): string => {
  switch (type) {
    case 'email':
      return 'example@company.com';
    case 'phone':
      return '+7 (999) 123-45-67';
    case 'messenger':
      return '@username';
    case 'url':
      return 'https://example.com';
    case 'numeric':
      return '0';
    case 'smart_address':
      return 'г. Москва, ул. Примерная, д. 1';
    default:
      return '';
  }
};

interface AddFieldDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (type: FieldType, name: string, options?: SelectOption[], referenceConfig?: ReferenceConfig) => void;
  customFieldDefinitions: Array<{ id: string; name: string; type: string }>;
}

const AddFieldDialog = ({ open, onClose, onAdd, customFieldDefinitions }: AddFieldDialogProps) => {
  const [selectedType, setSelectedType] = useState<FieldType>('text');
  const [fieldName, setFieldName] = useState('');
  const [selectOptions, setSelectOptions] = useState<string[]>(['']);
  const [referenceType, setReferenceType] = useState<ReferenceType>('deal');
  const [customReferenceName, setCustomReferenceName] = useState('');
  const [selectedCustomFieldId, setSelectedCustomFieldId] = useState('');
  const [multipleReference, setMultipleReference] = useState(false);

  // Filter only 'reference' type custom fields (справочники)
  const availableCustomReferences = customFieldDefinitions.filter((f) => f.type === 'reference');

  const handleAdd = () => {
    if (!fieldName.trim()) return;

    const options = selectedType === 'select'
      ? selectOptions
          .filter(opt => opt.trim())
          .map((opt, idx) => ({ value: `opt_${idx}`, label: opt.trim() }))
      : undefined;

    const selectedCustomRef = availableCustomReferences.find((r) => r.id === selectedCustomFieldId);
    const refConfig: ReferenceConfig | undefined = selectedType === 'reference'
      ? {
          referenceType,
          customReferenceId: referenceType === 'custom' ? selectedCustomFieldId : undefined,
          customReferenceName: referenceType === 'custom' ? (selectedCustomRef?.name || customReferenceName.trim()) : undefined,
          multiple: multipleReference,
        }
      : undefined;

    onAdd(selectedType, fieldName.trim(), options, refConfig);
    setFieldName('');
    setSelectedType('text');
    setSelectOptions(['']);
    setReferenceType('deal');
    setCustomReferenceName('');
    setSelectedCustomFieldId('');
    setMultipleReference(false);
    onClose();
  };

  const handleAddOption = () => {
    setSelectOptions([...selectOptions, '']);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...selectOptions];
    newOptions[index] = value;
    setSelectOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    setSelectOptions(selectOptions.filter((_, i) => i !== index));
  };

  if (!open) return null;

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        mb: 2,
        border: '1px solid',
        borderColor: 'primary.main',
        borderRadius: 2,
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Добавить новое поле
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          select
          label="Тип поля"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as FieldType)}
          sx={{ minWidth: 180 }}
          size="small"
        >
          {FIELD_TYPES.map((field) => (
            <MenuItem key={field.type} value={field.type}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getFieldIcon(field.type)}
                <Box>
                  <Typography variant="body2">{field.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {field.description}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Название поля"
          value={fieldName}
          onChange={(e) => setFieldName(e.target.value)}
          placeholder="Например: Рабочий телефон"
          size="small"
          fullWidth
        />
      </Box>

      <Collapse in={selectedType === 'select'}>
        <Box sx={{ mb: 2, pl: 2, borderLeft: '2px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Варианты для выбора:
          </Typography>
          {selectOptions.map((option, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder={`Вариант ${index + 1}`}
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                sx={{ flex: 1 }}
              />
              {selectOptions.length > 1 && (
                <IconButton size="small" onClick={() => handleRemoveOption(index)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          ))}
          <Button size="small" startIcon={<AddIcon />} onClick={handleAddOption}>
            Добавить вариант
          </Button>
        </Box>
      </Collapse>

      <Collapse in={selectedType === 'reference'}>
        <Box sx={{ mb: 2, pl: 2, borderLeft: '2px solid', borderColor: 'primary.light' }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Настройки справочника:
          </Typography>

          <TextField
            select
            label="Тип справочника"
            value={referenceType}
            onChange={(e) => setReferenceType(e.target.value as ReferenceType)}
            size="small"
            fullWidth
            sx={{ mb: 1.5 }}
          >
            {REFERENCE_TYPES.map((ref) => (
              <MenuItem key={ref.type} value={ref.type}>
                <Box>
                  <Typography variant="body2">{ref.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {ref.description}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </TextField>

          <Collapse in={referenceType === 'custom'}>
            {availableCustomReferences.length > 0 ? (
              <TextField
                select
                label="Выберите справочник"
                value={selectedCustomFieldId}
                onChange={(e) => setSelectedCustomFieldId(e.target.value)}
                size="small"
                fullWidth
                sx={{ mb: 1.5 }}
              >
                {availableCustomReferences.map((ref) => (
                  <MenuItem key={ref.id} value={ref.id}>
                    {ref.name}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Нет доступных справочников. Создайте справочник в разделе "Пользовательские поля".
              </Typography>
            )}
          </Collapse>

          <FormControlLabel
            control={
              <Checkbox
                checked={multipleReference}
                onChange={(e) => setMultipleReference(e.target.checked)}
                size="small"
              />
            }
            label={
              <Typography variant="body2">
                Множественный выбор (можно выбрать несколько значений)
              </Typography>
            }
          />
        </Box>
      </Collapse>

      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button size="small" onClick={onClose}>
          Отмена
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={handleAdd}
          disabled={!fieldName.trim() || (selectedType === 'reference' && referenceType === 'custom' && !selectedCustomFieldId)}
        >
          Добавить
        </Button>
      </Box>
    </Paper>
  );
};

interface CustomFieldInputProps {
  field: CustomField;
  onChange: (value: string | number | string[]) => void;
  onRemove: () => void;
  deals?: Deal[];
}

const CustomFieldInput = ({ field, onChange, onRemove, deals = [] }: CustomFieldInputProps) => {
  const getReferenceOptions = () => {
    if (!field.referenceConfig) return [];

    switch (field.referenceConfig.referenceType) {
      case 'deal':
        return deals.map(d => ({ id: d.id, label: d.title }));
      case 'custom':
        return [];
      default:
        return [];
    }
  };

  const getReferenceLabel = () => {
    if (!field.referenceConfig) return 'Справочник';

    switch (field.referenceConfig.referenceType) {
      case 'deal':
        return 'Сделка';
      case 'custom':
        return field.referenceConfig.customReferenceName || 'Кастомный справочник';
      default:
        return 'Справочник';
    }
  };

  const renderInput = () => {
    switch (field.type) {
      case 'reference': {
        const options = getReferenceOptions();
        const refLabel = getReferenceLabel();

        if (field.referenceConfig?.multiple) {
          const selectedValues = Array.isArray(field.value) ? field.value : [];
          const selectedOptions = options.filter(opt => selectedValues.includes(opt.id));

          return (
            <Autocomplete
              multiple
              options={options}
              getOptionLabel={(option) => option.label}
              value={selectedOptions}
              onChange={(_, newValue) => onChange(newValue.map(v => v.id))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label={`${field.name} (${refLabel})`}
                  placeholder={`Выберите ${refLabel.toLowerCase()}`}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={option.label}
                    size="small"
                  />
                ))
              }
            />
          );
        }

        const selectedOption = options.find(opt => opt.id === field.value) || null;

        return (
          <Autocomplete
            options={options}
            getOptionLabel={(option) => option.label}
            value={selectedOption}
            onChange={(_, newValue) => onChange(newValue?.id || '')}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label={`${field.name} (${refLabel})`}
                placeholder={`Выберите ${refLabel.toLowerCase()}`}
              />
            )}
          />
        );
      }

      case 'select':
        return (
          <TextField
            select
            fullWidth
            size="small"
            label={field.name}
            value={field.value || ''}
            onChange={(e) => onChange(e.target.value)}
          >
            {field.options?.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        );

      case 'textarea':
        return (
          <TextField
            fullWidth
            size="small"
            label={field.name}
            multiline
            rows={2}
            value={field.value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case 'numeric':
        return (
          <TextField
            fullWidth
            size="small"
            label={field.name}
            type="number"
            value={field.value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={getFieldPlaceholder(field.type)}
          />
        );

      case 'email':
        return (
          <TextField
            fullWidth
            size="small"
            label={field.name}
            type="email"
            value={field.value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={getFieldPlaceholder(field.type)}
          />
        );

      case 'url':
        return (
          <TextField
            fullWidth
            size="small"
            label={field.name}
            type="url"
            value={field.value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={getFieldPlaceholder(field.type)}
          />
        );

      case 'messenger':
        return (
          <TextField
            fullWidth
            size="small"
            label={field.name}
            value={field.value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={getFieldPlaceholder(field.type)}
            InputProps={{
              startAdornment: (
                <MessengerIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              ),
            }}
          />
        );

      default:
        return (
          <TextField
            fullWidth
            size="small"
            label={field.name}
            value={field.value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || getFieldPlaceholder(field.type)}
          />
        );
    }
  };

  const getChipLabel = () => {
    const baseLabel = FIELD_TYPES.find(f => f.type === field.type)?.label || field.type;
    if (field.type === 'reference' && field.referenceConfig) {
      const refType = REFERENCE_TYPES.find(r => r.type === field.referenceConfig?.referenceType);
      if (field.referenceConfig.referenceType === 'custom') {
        return `${baseLabel}: ${field.referenceConfig.customReferenceName}`;
      }
      return `${baseLabel}: ${refType?.label || ''}`;
    }
    return baseLabel;
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', pt: 1, color: 'text.secondary' }}>
        <DragIcon fontSize="small" sx={{ cursor: 'grab' }} />
      </Box>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          {getFieldIcon(field.type)}
          <Chip
            label={getChipLabel()}
            size="small"
            variant="outlined"
            color={field.type === 'reference' ? 'primary' : 'default'}
            sx={{ height: 20, fontSize: '0.7rem' }}
          />
          {field.referenceConfig?.multiple && (
            <Chip
              label="множ."
              size="small"
              variant="filled"
              color="secondary"
              sx={{ height: 18, fontSize: '0.65rem' }}
            />
          )}
        </Box>
        {renderInput()}
      </Box>
      <IconButton
        size="small"
        onClick={onRemove}
        sx={{ mt: 0.5, color: 'error.main' }}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

export const CustomFieldBuilder = ({
  fields,
  onChange,
  title = 'Дополнительные поля',
  deals = [],
}: CustomFieldBuilderProps) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { fieldDefinitions } = useCustomFields();

  // Map field definitions to a simpler format for AddFieldDialog
  const customFieldDefinitions = fieldDefinitions
    .filter((f) => f.active)
    .map((f) => ({ id: f.id, name: f.name, type: f.type }));

  const handleAddField = (type: FieldType, name: string, options?: SelectOption[], referenceConfig?: ReferenceConfig) => {
    const newField: CustomField = {
      id: `field_${Date.now()}`,
      type,
      name,
      value: type === 'numeric' ? 0 : (referenceConfig?.multiple ? [] : ''),
      options,
      referenceConfig,
      placeholder: getFieldPlaceholder(type),
    };
    onChange([...fields, newField]);
  };

  const handleFieldChange = (index: number, value: string | number | string[]) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], value };
    onChange(newFields);
  };

  const handleRemoveField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setShowAddDialog(true)}
          variant="outlined"
        >
          Добавить поле
        </Button>
      </Box>

      <AddFieldDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAddField}
        customFieldDefinitions={customFieldDefinitions}
      />

      {fields.length > 0 && (
        <Box sx={{ mt: 1 }}>
          {fields.map((field, index) => (
            <CustomFieldInput
              key={field.id}
              field={field}
              onChange={(value) => handleFieldChange(index, value)}
              onRemove={() => handleRemoveField(index)}
              deals={deals}
            />
          ))}
        </Box>
      )}

      {fields.length === 0 && !showAddDialog && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          Нет дополнительных полей. Нажмите "Добавить поле" для создания.
        </Typography>
      )}
    </Box>
  );
};
