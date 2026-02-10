import { useMemo, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  OpenInNew as OpenInNewIcon,
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
  const { getCatalog, getEntriesByCatalog } = useCatalogs();
  const [inputValue, setInputValue] = useState('');

  const allEntries = useMemo(() => getEntriesByCatalog(catalogId), [catalogId, getEntriesByCatalog]);

  const selectedIds = useMemo(() => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  const selectedEntries = useMemo(
    () => allEntries.filter((entry) => selectedIds.includes(entry.id)),
    [allEntries, selectedIds]
  );

  const canCreate = Boolean(onCreateNew);
  const canEdit = Boolean(onEdit);
  const canOpenDetail = Boolean(onOpenDetail);

  const handleChange = (_event: unknown, newValue: CatalogEntry | CatalogEntry[] | null) => {
    if (multiple) {
      const entries = (newValue as CatalogEntry[]) || [];
      onChange(entries.map((entry) => entry.id));
      return;
    }

    const entry = newValue as CatalogEntry | null;
    onChange(entry ? entry.id : '');
  };

  const handleCreateNew = (event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    onCreateNew?.();
  };

  const handleOpenDetail = (entryId: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    onOpenDetail?.(entryId);
  };

  const handleEdit = (entryId: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    onEdit?.(entryId, catalogId);
  };

  return (
    <Box>
      <Autocomplete
        multiple={multiple}
        disableCloseOnSelect={multiple}
        filterSelectedOptions={multiple}
        value={multiple ? selectedEntries : selectedEntries[0] || null}
        onChange={handleChange}
        inputValue={inputValue}
        onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
        options={allEntries}
        getOptionLabel={(option) => option.displayValue}
        isOptionEqualToValue={(option, entry) => option.id === entry.id}
        filterOptions={(_options, state) => {
          const query = state.inputValue.toLowerCase().trim();
          if (!query) return allEntries;
          return allEntries.filter((option) => option.displayValue.toLowerCase().includes(query));
        }}
        noOptionsText={
          <Box sx={{ textAlign: 'center', py: 1 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: canCreate ? 1 : 0 }}>
              {allEntries.length === 0 ? 'Данных пока нет. Создайте запись.' : 'Ничего не найдено'}
            </Typography>
            {canCreate && (
              <Button
                startIcon={<AddIcon />}
                onClick={handleCreateNew}
                size="small"
                sx={{ textTransform: 'none' }}
              >
                Создать запись
              </Button>
            )}
          </Box>
        }
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            placeholder={selectedIds.length === 0 ? 'Выбрать из каталога' : 'Начните ввод для поиска'}
            variant="outlined"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {params.InputProps.endAdornment}
                  {!multiple && selectedIds.length > 0 && canEdit && (
                    <InputAdornment position="end">
                      <Tooltip title="Редактировать выбранную запись">
                        <IconButton
                          size="small"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={(event) => handleEdit(selectedIds[0], event)}
                          sx={{ p: 0.5 }}
                        >
                          <EditIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      </Tooltip>
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
          const optionCatalog = getCatalog(option.catalogId);
          const detailFields = option.fields
            .slice(0, 2)
            .map((fieldValue) => {
              const fieldDef = optionCatalog?.fields.find((f) => f.id === fieldValue.fieldId);
              const displayValue = Array.isArray(fieldValue.value)
                ? fieldValue.value.join(', ')
                : fieldValue.value;

              return `${fieldDef?.name || fieldValue.fieldId}: ${displayValue}`;
            })
            .join(' · ');

          return (
            <li {...props} key={option.id}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  width: '100%',
                  py: 0.75,
                  gap: 1,
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {option.displayValue}
                  </Typography>
                  {detailFields && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
                  {canEdit && (
                    <Tooltip title="Редактировать">
                      <IconButton
                        size="small"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => handleEdit(option.id, event)}
                        sx={{ p: 0.5 }}
                      >
                        <EditIcon sx={{ fontSize: '0.95rem' }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  {canOpenDetail && (
                    <Tooltip title="Открыть карточку">
                      <IconButton
                        size="small"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => handleOpenDetail(option.id, event)}
                        sx={{ p: 0.5 }}
                      >
                        <OpenInNewIcon sx={{ fontSize: '0.95rem' }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
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
                '&:hover': { backgroundColor: '#dde6f0' },
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
          style: { maxHeight: '300px' },
        }}
        ListboxComponent={(listboxProps) => (
          <Box {...listboxProps} component="ul">
            <Box
              sx={{
                px: 2,
                py: 1,
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                position: 'sticky',
                top: 0,
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
              }}
            >
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {multiple ? 'Выберите одно или несколько значений' : 'Выберите значение из списка'}
              </Typography>
              {canCreate && (
                <Button
                  size="small"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={handleCreateNew}
                  startIcon={<AddIcon sx={{ fontSize: '0.95rem' }} />}
                  sx={{ textTransform: 'none', minWidth: 'max-content' }}
                >
                  Создать
                </Button>
              )}
            </Box>
            {listboxProps.children}
          </Box>
        )}
        sx={{ width: '100%' }}
      />
    </Box>
  );
};
