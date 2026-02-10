import { useState, useMemo } from 'react';
import {
  Autocomplete,
  TextField,
  Chip,
  Box,
  IconButton,
  Typography,
  Button,
  InputAdornment,
} from '@mui/material';
import {
  Contacts as ContactsIcon,
  OpenInNew as OpenInNewIcon,
  Add as AddIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { ReferenceFieldDef } from '../context/CustomFieldsContext';
import { useReferenceEntries } from '../context/ReferenceEntriesContext';
import { ReferenceEntry } from '../types';

interface Props {
  fieldDef: ReferenceFieldDef;
  referenceDefinitionId: string;
  value: string | string[] | null;
  onChange: (value: string | string[]) => void;
  filterByField?: { fieldId: string; value: string };
  onOpenDetail?: (entryId: string) => void;
  onCreateNew?: () => void;
  onEdit?: (entryId: string, referenceId: string) => void;
}

export const ReferenceFieldSelect = ({
  fieldDef,
  referenceDefinitionId: _referenceDefinitionId,
  value,
  onChange,
  filterByField,
  onOpenDetail,
  onCreateNew,
  onEdit,
}: Props) => {
  const { getEntriesByReference, getEntriesWhereFieldEquals } = useReferenceEntries();

  const [inputValue, setInputValue] = useState('');

  // Определяем, является ли поле множественным выбором
  const isMultiple = fieldDef.type === 'multiselect';

  // Получаем записи из целевого справочника
  const allEntries = useMemo(() => {
    if (!fieldDef.targetReferenceId) {
      return [];
    }
    return getEntriesByReference(fieldDef.targetReferenceId);
  }, [fieldDef.targetReferenceId, getEntriesByReference]);

  // Применяем каскадную фильтрацию, если она настроена
  const filteredEntries = useMemo(() => {
    if (!fieldDef.cascadeFilter || !filterByField || !fieldDef.targetReferenceId) {
      return allEntries;
    }

    return getEntriesWhereFieldEquals(
      fieldDef.targetReferenceId,
      filterByField.fieldId,
      filterByField.value
    );
  }, [
    allEntries,
    fieldDef.cascadeFilter,
    fieldDef.targetReferenceId,
    filterByField,
    getEntriesWhereFieldEquals,
  ]);

  // Конвертируем value в массив ID для удобства работы
  const selectedIds = useMemo(() => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  // Находим выбранные записи
  const selectedEntries = useMemo(() => {
    return filteredEntries.filter((entry) => selectedIds.includes(entry.id));
  }, [filteredEntries, selectedIds]);

  // Используем только отфильтрованные записи без специальной опции создания
  const options = filteredEntries;

  // Обработчик изменения выбора
  const handleChange = (_event: any, newValue: ReferenceEntry | ReferenceEntry[] | null) => {
    if (isMultiple) {
      const entries = (newValue as ReferenceEntry[]) || [];
      const ids = entries.map((entry) => entry.id);
      onChange(ids);
    } else {
      const entry = newValue as ReferenceEntry | null;
      onChange(entry ? entry.id : '');
    }
  };

  // Обработчик создания новой записи
  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew();
    } else {
      // Fallback - TODO: Открыть диалог создания новой записи
      console.log('Create new entry in reference:', fieldDef.targetReferenceId);
    }
  };

  // Обработчик открытия детального просмотра
  const handleOpenDetail = (entryId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    onOpenDetail?.(entryId);
  };

  // Обработчик редактирования записи
  const handleEdit = (entryId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    onEdit?.(entryId, fieldDef.targetReferenceId || '');
  };

  // Пустое состояние - нет записей в справочнике
  if (filteredEntries.length === 0 && allEntries.length === 0) {
    return (
      <Box
        sx={{
          border: '1px dashed #ccc',
          borderRadius: 2,
          p: 2,
          textAlign: 'center',
          backgroundColor: '#fafafa',
        }}
      >
        <ContactsIcon sx={{ fontSize: 40, color: '#bbb', mb: 1 }} />
        <Typography variant="body2" sx={{ color: '#999', mb: 1.5 }}>
          Нет записей. Создайте первую запись.
        </Typography>
        <Button
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
          size="small"
          variant="outlined"
          sx={{
            color: '#7B1FA2',
            borderColor: '#7B1FA2',
            textTransform: 'none',
            '&:hover': {
              borderColor: '#6A1B9A',
              backgroundColor: 'rgba(123, 31, 162, 0.04)',
            },
          }}
        >
          Создать запись
        </Button>
      </Box>
    );
  }

  // Основной компонент - Autocomplete
  return (
    <Autocomplete
      multiple={isMultiple}
      disableCloseOnSelect={isMultiple}
      filterSelectedOptions={isMultiple}
      value={isMultiple ? selectedEntries : selectedEntries[0] || null}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
      options={options}
      getOptionLabel={(option) => option.displayValue}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      filterOptions={(_options, state) => {
        // Фильтруем записи по введенному тексту
        return filteredEntries.filter((option) =>
          option.displayValue.toLowerCase().includes(state.inputValue.toLowerCase())
        );
      }}
      noOptionsText={
        <Box sx={{ textAlign: 'center', py: 1 }}>
          <Typography variant="body2" sx={{ color: '#999', mb: 1 }}>
            {fieldDef.cascadeFilter && filterByField
              ? 'Нет записей, соответствующих фильтру'
              : 'Нет записей'}
          </Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={handleCreateNew}
            size="small"
            sx={{
              color: '#1976D2',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
              },
            }}
          >
            Создать новую запись
          </Button>
        </Box>
      }
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          placeholder={selectedIds.length === 0 ? 'Добавить значение' : ''}
          variant="outlined"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {params.InputProps.endAdornment}
                {/* Кнопка редактирования для одиночного выбора */}
                {!isMultiple && selectedIds.length > 0 && onEdit && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(selectedIds[0]);
                      }}
                      sx={{
                        p: 0.5,
                        color: '#999',
                        '&:hover': {
                          color: '#1976D2',
                          backgroundColor: 'rgba(25, 118, 210, 0.08)',
                        },
                      }}
                    >
                      <EditIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </InputAdornment>
                )}
              </>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: '#fff',
              minHeight: 40,
              alignItems: 'center',
            },
            '& .MuiAutocomplete-input': {
              py: '7px !important',
            },
            '& .MuiAutocomplete-inputRoot': {
              flexWrap: 'nowrap',
            },
            '& .MuiAutocomplete-tag': {
              my: 0.25,
            },
          }}
        />
      )}
      renderOption={(props, option) => {
        // Получаем поля записи для детального отображения
        const detailFields = option.fields
          .slice(0, 3) // Показываем максимум 3 поля
          .map((field) => {
            const displayValue = Array.isArray(field.value)
              ? field.value.join(', ')
              : field.value;
            return `${field.fieldName}: ${displayValue}`;
          })
          .join(', ');

        return (
          <li {...props} key={option.id}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                width: '100%',
                py: 1,
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                  {option.displayValue}
                </Typography>
                {detailFields && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#999',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {detailFields}
                  </Typography>
                )}
              </Box>
              {onOpenDetail && (
                <IconButton
                  size="small"
                  onClick={(e) => handleOpenDetail(option.id, e)}
                  sx={{
                    ml: 1,
                    p: 0.5,
                    color: '#999',
                    flexShrink: 0,
                    '&:hover': {
                      color: '#1976D2',
                      backgroundColor: 'rgba(25, 118, 210, 0.08)',
                    },
                  }}
                >
                  <OpenInNewIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              )}
            </Box>
          </li>
        );
      }}
      renderTags={(tagValue, getTagProps) => {
        if (tagValue.length === 0) return [];

        const visibleOption = tagValue[0];
        const { onDelete, ...chipProps } = getTagProps({ index: 0 });
        const hiddenCount = tagValue.length - 1;

        return [
          <Chip
            {...chipProps}
            key={visibleOption.id}
            label={visibleOption.displayValue}
            size="small"
            onDelete={onDelete}
            sx={{
              backgroundColor: '#e8eef5',
              color: '#334155',
              maxWidth: 140,
              '& .MuiChip-label': {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              },
              '& .MuiChip-deleteIcon': {
                color: '#64748b',
              },
              '&:hover': {
                backgroundColor: '#dde6f0',
              },
            }}
          />,
          ...(hiddenCount > 0
            ? [
              <Chip
                key="selected-counter"
                label={`+${hiddenCount}`}
                size="small"
                sx={{
                  backgroundColor: '#eef2f7',
                  color: '#475569',
                }}
              />,
            ]
            : []),
        ];
      }}
      ListboxProps={{
        style: {
          maxHeight: '300px',
        },
      }}
      ListboxComponent={(listboxProps) => (
        <Box {...listboxProps} component="ul">
          {/* Заголовок/подсказка с кнопкой создания */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: '#fafafa',
              position: 'sticky',
              top: 0,
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="caption" sx={{ color: '#666' }}>
              Выберите запись или{' '}
              <Typography
                component="span"
                variant="caption"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCreateNew();
                }}
                sx={{
                  color: '#1976D2',
                  cursor: 'pointer',
                  fontWeight: 500,
                  textDecoration: 'underline',
                  '&:hover': {
                    color: '#1565C0',
                  },
                }}
              >
                создайте новую
              </Typography>
            </Typography>
          </Box>
          {listboxProps.children}
        </Box>
      )}
      sx={{
        width: '100%',
      }}
    />
  );
};
