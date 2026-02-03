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
} from '@mui/material';
import InputMask from 'react-input-mask';
import { useCustomFields } from '../context/CustomFieldsContext';
import { useReferenceEntries } from '../context/ReferenceEntriesContext';
import { ReferenceFieldValue, ReferenceEntry } from '../types';
import type { ReferenceFieldDef } from '../context/CustomFieldsContext';
import { ReferenceFieldSelect } from './ReferenceFieldSelect';

interface Props {
  open: boolean;
  referenceDefinitionId: string | null;
  onClose: () => void;
  onCreate: (entryId: string) => void;
  // Новые props для редактирования
  editMode?: boolean;
  entryToEdit?: ReferenceEntry;
  onUpdate?: (entryId: string) => void;
}

export const CreateReferenceEntryDialog = ({
  open,
  referenceDefinitionId,
  onClose,
  onCreate,
  editMode = false,
  entryToEdit,
  onUpdate,
}: Props) => {
  const { fieldDefinitions } = useCustomFields();
  const { addEntry, updateEntry } = useReferenceEntries();

  // Состояние формы: map fieldId -> value
  const [formData, setFormData] = useState<Record<string, string | number | string[]>>({});

  // Состояние для вложенного создания записей
  const [creatingNestedForField, setCreatingNestedForField] = useState<string | null>(null);

  // Получаем определение справочника
  const referenceDefinition = useMemo(() => {
    if (!referenceDefinitionId) return null;
    return fieldDefinitions.find((def) => def.id === referenceDefinitionId);
  }, [fieldDefinitions, referenceDefinitionId]);

  // Поля справочника
  const referenceFields = useMemo(() => {
    return referenceDefinition?.referenceFields || [];
  }, [referenceDefinition]);

  // Инициализируем форму при открытии диалога
  useEffect(() => {
    if (open) {
      if (editMode && entryToEdit) {
        // Режим редактирования: заполняем поля значениями из записи
        const initialData: Record<string, string | number> = {};
        entryToEdit.fields.forEach((field) => {
          // Преобразуем значение в строку или число
          if (Array.isArray(field.value)) {
            // Для массивов пока не поддерживаем редактирование (reference multiple)
            initialData[field.fieldId] = field.value.join(', ');
          } else {
            initialData[field.fieldId] = field.value;
          }
        });
        setFormData(initialData);
      } else {
        // Режим создания: очищаем форму
        setFormData({});
      }
    }
  }, [open, editMode, entryToEdit]);

  // Проверка валидации: все обязательные поля заполнены
  const isFormValid = useMemo(() => {
    return referenceFields.every((field) => {
      if (!field.required) return true;
      const value = formData[field.id];
      return value !== undefined && value !== '' && value !== null;
    });
  }, [formData, referenceFields]);

  const handleChange = (fieldId: string, value: string | number | string[]) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleNestedCreate = (_fieldId: string, targetReferenceId: string) => {
    setCreatingNestedForField(targetReferenceId);
  };

  const handleNestedEntryCreated = (entryId: string) => {
    // Найти поле, для которого создавали запись
    const targetField = referenceFields.find(f =>
      f.type === 'reference' && f.targetReferenceId === creatingNestedForField
    );

    if (targetField) {
      handleChange(targetField.id, entryId);
    }

    setCreatingNestedForField(null);
  };

  const handleSave = () => {
    if (!referenceDefinitionId || !isFormValid) return;

    // Собираем все поля в массив ReferenceFieldValue[]
    const fields: ReferenceFieldValue[] = referenceFields.map((fieldDef) => {
      const value = formData[fieldDef.id];
      return {
        fieldId: fieldDef.id,
        fieldName: fieldDef.name,
        fieldType: fieldDef.type,
        value: value !== undefined ? value : '',
      };
    });

    // Первое поле используется как displayValue
    const displayValue = String(formData[referenceFields[0]?.id] || '');

    if (editMode && entryToEdit && onUpdate) {
      // Режим редактирования: обновляем существующую запись
      updateEntry(entryToEdit.id, {
        displayValue,
        fields,
      });

      // Вызываем callback обновления
      onUpdate(entryToEdit.id);
    } else {
      // Режим создания: создаем новую запись
      const entryId = addEntry({
        referenceDefinitionId,
        displayValue,
        fields,
      });

      // Вызываем callback создания
      onCreate(entryId);
    }

    // Закрываем диалог
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const renderField = (field: ReferenceFieldDef) => {
    const value = formData[field.id] || '';
    const label = field.required ? `${field.name} *` : field.name;

    switch (field.type) {
      case 'phone':
        return (
          <InputMask
            key={field.id}
            mask="+7 (999) 999-99-99"
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
          >
            {() => (
              <TextField
                fullWidth
                label={label}
                variant="outlined"
                required={field.required}
              />
            )}
          </InputMask>
        );

      case 'email':
        return (
          <TextField
            key={field.id}
            fullWidth
            type="email"
            label={label}
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            variant="outlined"
            required={field.required}
          />
        );

      case 'numeric':
        return (
          <TextField
            key={field.id}
            fullWidth
            type="number"
            label={label}
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            variant="outlined"
            required={field.required}
          />
        );

      case 'url':
        return (
          <TextField
            key={field.id}
            fullWidth
            type="url"
            label={label}
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            variant="outlined"
            required={field.required}
          />
        );

      case 'reference':
      case 'multiselect':
        // Для полей-справочников используем ReferenceFieldSelect
        if (field.type === 'reference' || field.type === 'multiselect') {
          return (
            <Box key={field.id}>
              <Typography variant="caption" sx={{ color: '#666', mb: 0.5, display: 'block' }}>
                {label}
                {field.targetReferenceName && (
                  <Typography component="span" variant="caption" sx={{ color: '#999', ml: 1 }}>
                    (Справочник: {field.targetReferenceName})
                  </Typography>
                )}
              </Typography>
              <ReferenceFieldSelect
                fieldDef={field}
                referenceDefinitionId={referenceDefinitionId || ''}
                value={(formData[field.id] as string | string[]) || (field.type === 'multiselect' ? [] : '')}
                onChange={(val) => handleChange(field.id, val)}
                onCreateNew={() => handleNestedCreate(field.id, field.targetReferenceId || '')}
              />
            </Box>
          );
        }
        return null;

      case 'text':
      default:
        return (
          <TextField
            key={field.id}
            fullWidth
            label={label}
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            variant="outlined"
            required={field.required}
          />
        );
    }
  };

  if (!referenceDefinition) {
    return null;
  }

  // Определяем заголовок диалога
  const dialogTitle = editMode && entryToEdit
    ? `Редактировать ${entryToEdit.displayValue}`
    : `Создать ${referenceDefinition.name}`;

  // Определяем текст кнопки сохранения
  const saveButtonText = editMode ? 'Сохранить' : 'Создать';

  return (
    <>
      <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {referenceFields.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Нет полей для заполнения
              </Typography>
            ) : (
              referenceFields.map((field) => renderField(field))
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Отмена</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!isFormValid || referenceFields.length === 0}
          >
            {saveButtonText}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Вложенный диалог для создания записи в связанном справочнике */}
      <CreateReferenceEntryDialog
        open={Boolean(creatingNestedForField)}
        referenceDefinitionId={creatingNestedForField}
        onClose={() => setCreatingNestedForField(null)}
        onCreate={handleNestedEntryCreated}
      />
    </>
  );
};
