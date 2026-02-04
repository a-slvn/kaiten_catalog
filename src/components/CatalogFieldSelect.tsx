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
  Folder as FolderIcon,
  OpenInNew as OpenInNewIcon,
  Add as AddIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useCatalogs } from '../context/CatalogsContext';
import { CatalogEntry } from '../types';

interface Props {
  catalogId: string;
  value: string | string[] | null;
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  onOpenDetail?: (entryId: string) => void;
  onCreateNew?: () => void;
  onEdit?: (entryId: string, catalogId: string) => void;
}

export const CatalogFieldSelect = ({
  catalogId,
  value,
  onChange,
  multiple = false,
  onOpenDetail,
  onCreateNew,
  onEdit,
}: Props) => {
  const { getEntriesByCatalog, getCatalog } = useCatalogs();
  const [inputValue, setInputValue] = useState('');

  const catalog = getCatalog(catalogId);
  const allEntries = useMemo(() => {
    return getEntriesByCatalog(catalogId);
  }, [catalogId, getEntriesByCatalog]);

  // Конвертируем value в массив ID для удобства работы
  const selectedIds = useMemo(() => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  // Находим выбранные записи
  const selectedEntries = useMemo(() => {
    return allEntries.filter((entry) => selectedIds.includes(entry.id));
  }, [allEntries, selectedIds]);

  // Обработчик изменения выбора
  const handleChange = (_event: any, newValue: CatalogEntry | CatalogEntry[] | null) => {
    if (multiple) {
      const entries = (newValue as CatalogEntry[]) || [];
      const ids = entries.map((entry) => entry.id);
      onChange(ids);
    } else {
      const entry = newValue as CatalogEntry | null;
      onChange(entry ? entry.id : '');
    }
  };

  // Обработчик создания новой записи
  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew();
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
    onEdit?.(entryId, catalogId);
  };

  // Пустое состояние - нет записей в каталоге
  if (allEntries.length === 0) {
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
        <FolderIcon sx={{ fontSize: 40, color: '#bbb', mb: 1 }} />
        <Typography variant="body2" sx={{ color: '#999', mb: 1.5 }}>
          Нет записей в каталоге "{catalog?.name || 'Каталог'}".
          {onCreateNew ? ' Создайте первую запись.' : ''}
        </Typography>
        {onCreateNew && (
          <Button
            startIcon={<AddIcon />}
            onClick={handleCreateNew}
            size="small"
            variant="outlined"
            sx={{
              color: '#1976D2',
              borderColor: '#1976D2',
              textTransform: 'none',
              '&:hover': {
                borderColor: '#1565C0',
                backgroundColor: 'rgba(25, 118, 210, 0.04)',
              },
            }}
          >
            Создать запись
          </Button>
        )}
      </Box>
    );
  }

  // Основной компонент - Autocomplete
  return (
    <Autocomplete
      multiple={multiple}
      value={multiple ? selectedEntries : selectedEntries[0] || null}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
      options={allEntries}
      getOptionLabel={(option) => option.displayValue}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      filterOptions={(_options, state) => {
        return allEntries.filter((option) =>
          option.displayValue.toLowerCase().includes(state.inputValue.toLowerCase())
        );
      }}
      noOptionsText={
        <Box sx={{ textAlign: 'center', py: 1 }}>
          <Typography variant="body2" sx={{ color: '#999', mb: 1 }}>
            Нет записей
          </Typography>
          {onCreateNew && (
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
          )}
        </Box>
      }
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          placeholder={selectedIds.length === 0 ? 'Выбрать из каталога' : ''}
          variant="outlined"
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <InputAdornment position="start">
                  <FolderIcon sx={{ fontSize: '1.2rem', color: '#1976D2' }} />
                </InputAdornment>
                {params.InputProps.startAdornment}
              </>
            ),
            endAdornment: (
              <>
                {params.InputProps.endAdornment}
                {/* Кнопка редактирования для одиночного выбора */}
                {!multiple && selectedIds.length > 0 && onEdit && (
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
            },
          }}
        />
      )}
      renderOption={(props, option) => {
        // Получаем поля записи для детального отображения
        const catalog = getCatalog(option.catalogId);
        const detailFields = option.fields
          .slice(0, 3)
          .map((fieldValue) => {
            const fieldDef = catalog?.fields.find((f) => f.id === fieldValue.fieldId);
            const displayValue = Array.isArray(fieldValue.value)
              ? fieldValue.value.join(', ')
              : fieldValue.value;
            return `${fieldDef?.name || fieldValue.fieldId}: ${displayValue}`;
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
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => {
          const { onDelete, ...chipProps } = getTagProps({ index });
          return (
            <Chip
              {...chipProps}
              key={option.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                    {option.displayValue}
                  </Typography>
                  {onEdit && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(option.id, e);
                      }}
                      sx={{
                        p: 0.25,
                        ml: 0.5,
                        color: '#999',
                        '&:hover': {
                          color: '#1976D2',
                          backgroundColor: 'rgba(25, 118, 210, 0.08)',
                        },
                      }}
                    >
                      <EditIcon sx={{ fontSize: '0.875rem' }} />
                    </IconButton>
                  )}
                </Box>
              }
              size="small"
              onDelete={onDelete}
              sx={{
                backgroundColor: '#E3F2FD',
                '&:hover': {
                  backgroundColor: '#BBDEFB',
                },
              }}
            />
          );
        })
      }
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
              {onCreateNew ? (
                <>
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
                </>
              ) : (
                'Выберите запись'
              )}
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
