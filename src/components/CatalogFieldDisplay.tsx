import { useMemo, useState } from 'react';
import { Box, Button, IconButton, Popover, Tooltip, Typography } from '@mui/material';
import {
  Check as CheckIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { CatalogFieldSelect } from './CatalogFieldSelect';
import { useCatalogs } from '../context/CatalogsContext';
import { CatalogEntry } from '../types';

interface Props {
  catalogId: string;
  catalogName: string;
  value: string | string[] | null;
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  onCreateNew?: () => void;
  onEdit?: (entryId: string, catalogId: string) => void;
}

export const CatalogFieldDisplay = ({
  catalogId,
  catalogName,
  value,
  onChange,
  multiple = false,
  onCreateNew,
  onEdit,
}: Props) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const { getEntry, getCatalog } = useCatalogs();

  const catalog = getCatalog(catalogId);

  const selectedIds = useMemo(() => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  const selectedEntries = useMemo(
    () => selectedIds.map((id) => getEntry(id)).filter((entry): entry is CatalogEntry => Boolean(entry)),
    [selectedIds, getEntry]
  );

  const hasValue = selectedEntries.length > 0;
  const canCreate = Boolean(onCreateNew);
  const canEdit = Boolean(onEdit);

  const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleChange = (newValue: string | string[]) => {
    onChange(newValue);
    if (!multiple) {
      handleClose();
    }
  };

  const handleRemoveEntry = (entryId: string) => {
    if (multiple) {
      onChange(selectedIds.filter((id) => id !== entryId));
    } else {
      onChange('');
    }
  };

  // Получить краткое описание записи (первые 2 поля кроме displayValue)
  const getSubtitle = (entryId: string): string => {
    const entry = getEntry(entryId);
    if (!entry || !catalog) return '';
    const parts: string[] = [];
    for (const fv of entry.fields.slice(0, 3)) {
      if (parts.length >= 2) break;
      const def = catalog.fields.find((f) => f.id === fv.fieldId);
      const val = Array.isArray(fv.value) ? fv.value.join(', ') : fv.value;
      if (val && String(val) !== entry.displayValue) {
        parts.push(def ? `${def.name}: ${val}` : String(val));
      }
    }
    return parts.join(' · ');
  };

  const popover = (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      PaperProps={{ sx: { mt: 0.5, minWidth: 340, maxWidth: 460 } }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {catalog?.name || catalogName}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {multiple
            ? 'Выберите одно или несколько значений'
            : 'Выберите одно значение из каталога'}
        </Typography>
      </Box>
      <Box sx={{ p: 2 }}>
        <CatalogFieldSelect
          catalogId={catalogId}
          value={value}
          onChange={handleChange}
          multiple={multiple}
          onCreateNew={onCreateNew}
          onEdit={onEdit}
        />
        {multiple && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.25 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<CheckIcon />}
              onClick={handleClose}
              sx={{ textTransform: 'none' }}
            >
              Готово
            </Button>
          </Box>
        )}
      </Box>
    </Popover>
  );

  // Пустое состояние
  if (!hasValue) {
    return (
      <>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleOpenPopover}
          sx={{
            textTransform: 'none',
            borderStyle: 'dashed',
            borderColor: '#94a3b8',
            color: '#0f172a',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'rgba(25, 118, 210, 0.04)',
            },
          }}
        >
          Выбрать из {catalog?.name || catalogName}
        </Button>
        <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: 'text.secondary' }}>
          {canCreate
            ? 'Нет нужного значения? Его можно создать прямо из списка.'
            : 'Доступен только выбор существующих значений.'}
        </Typography>
        {popover}
      </>
    );
  }

  // С записями
  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {selectedEntries.map((entry) => {
          const subtitle = getSubtitle(entry.id);
          return (
            <Box
              key={entry.id}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 0.75,
                py: 0.5,
                px: 0.75,
                borderRadius: 1,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: 'text.primary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entry.displayValue}
                </Typography>
                {subtitle && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontSize: 12,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block',
                    }}
                  >
                    {subtitle}
                  </Typography>
                )}
              </Box>

              <Box
                className="entry-actions"
                sx={{
                  display: 'flex',
                  gap: 0.1,
                  flexShrink: 0,
                  mt: 0.1,
                }}
              >
                {canEdit && onEdit && (
                  <Tooltip title="Редактировать">
                    <IconButton
                      size="small"
                      onClick={() => onEdit(entry.id, catalogId)}
                      sx={{
                        p: 0.4,
                        color: 'text.secondary',
                        '&:hover': { color: 'primary.main' },
                      }}
                    >
                      <EditIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title={multiple ? 'Убрать из выбранных' : 'Очистить поле'}>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveEntry(entry.id)}
                    sx={{
                      p: 0.4,
                      color: 'text.secondary',
                      '&:hover': { color: 'error.main' },
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          );
        })}

        <Button
          size="small"
          variant="text"
          startIcon={<AddIcon sx={{ fontSize: 15 }} />}
          onClick={handleOpenPopover}
          sx={{
            textTransform: 'none',
            justifyContent: 'flex-start',
            width: 'fit-content',
            pl: 0.5,
          }}
        >
          {multiple ? 'Добавить или изменить значения' : 'Изменить значение'}
        </Button>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {canCreate && canEdit
            ? 'Можно выбрать, создать, редактировать и удалять значения.'
            : canEdit
              ? 'Можно выбирать, редактировать и удалять выбранные значения.'
              : canCreate
                ? 'Можно выбирать, создавать и удалять значения.'
                : 'Можно выбрать или удалить значение. Редактирование отключено.'}
        </Typography>
      </Box>
      {popover}
    </>
  );
};
