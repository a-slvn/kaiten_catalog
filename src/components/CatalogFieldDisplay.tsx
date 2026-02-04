import { useState, useMemo } from 'react';
import { Box, Typography, IconButton, Popover } from '@mui/material';
import { Edit as EditIcon, Folder as FolderIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { CatalogFieldSelect } from './CatalogFieldSelect';
import { useCatalogs } from '../context/CatalogsContext';
import { useReferenceEntries } from '../context/ReferenceEntriesContext';

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
  const [isHovered, setIsHovered] = useState(false);
  const { getEntry, getCatalog } = useCatalogs();
  const { getEntry: getReferenceEntry } = useReferenceEntries();

  // Конвертируем value в массив ID для удобства работы
  const selectedIds = useMemo(() => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  // Получаем выбранные записи с полями
  const selectedEntries = useMemo(() => {
    return selectedIds.map((id) => getEntry(id)).filter((e) => e);
  }, [selectedIds, getEntry]);

  const hasValue = selectedIds.length > 0;
  const catalog = getCatalog(catalogId);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleChange = (newValue: string | string[]) => {
    onChange(newValue);
    handleClose();
  };

  const handleRemove = () => {
    onChange(multiple ? [] : '');
  };

  const open = Boolean(anchorEl);

  // Если нет значения - показываем компактное поле для выбора
  if (!hasValue) {
    return (
      <>
        <Box
          onClick={handleClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1.5,
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            cursor: 'pointer',
            backgroundColor: '#fff',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: '#1976D2',
              backgroundColor: '#fafafa',
            },
          }}
        >
          <FolderIcon sx={{ fontSize: '1.2rem', color: '#1976D2' }} />
          <Typography variant="body2" sx={{ color: '#999' }}>
            Выбрать {catalogName}
          </Typography>
        </Box>

        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
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
              mt: 1,
              minWidth: anchorEl ? anchorEl.offsetWidth : 300,
              maxWidth: 500,
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <CatalogFieldSelect
              catalogId={catalogId}
              value={value}
              onChange={handleChange}
              multiple={multiple}
              onCreateNew={onCreateNew}
              onEdit={onEdit}
            />
          </Box>
        </Popover>
      </>
    );
  }

  // Обработчик редактирования записи
  const handleEditEntry = () => {
    if (onEdit && selectedIds.length > 0) {
      onEdit(selectedIds[0], catalogId);
    }
  };

  // Если есть значение - показываем все поля записи
  return (
    <>
      <Box
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        sx={{
          border: '1px solid #e0e0e0',
          borderRadius: 2,
          backgroundColor: '#fff',
          position: 'relative',
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: '#1976D2',
            backgroundColor: '#fafafa',
          },
        }}
      >
        {/* Кнопки действий при наведении */}
        {isHovered && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'flex',
              gap: 0.5,
              zIndex: 1,
            }}
          >
            {onEdit && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditEntry();
                }}
                sx={{
                  p: 0.5,
                  backgroundColor: '#fff',
                  border: '1px solid #e0e0e0',
                  '&:hover': {
                    color: '#1976D2',
                    borderColor: '#1976D2',
                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  },
                }}
              >
                <EditIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            )}
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              sx={{
                p: 0.5,
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                '&:hover': {
                  color: '#f44336',
                  borderColor: '#f44336',
                  backgroundColor: 'rgba(244, 67, 54, 0.04)',
                },
              }}
            >
              <DeleteIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          </Box>
        )}

        {/* Отображение записей */}
        <Box sx={{ p: 2 }}>
          {selectedEntries.map((entry, index) => (
            <Box key={entry!.id} sx={{ mb: index < selectedEntries.length - 1 ? 2 : 0 }}>
              {/* Название записи */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <FolderIcon sx={{ fontSize: '1.2rem', color: '#1976D2' }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>
                  {entry!.displayValue}
                </Typography>
              </Box>

              {/* Поля записи */}
              {entry!.fields.length > 0 && (
                <Box sx={{ pl: 3.5 }}>
                  {entry!.fields.map((fieldValue) => {
                    const fieldDef = catalog?.fields.find((f) => f.id === fieldValue.fieldId);
                    let displayValue: string;

                    // Резолвим ID записей справочников и каталогов в displayValue
                    const resolveId = (id: string): string => {
                      const refEntry = getReferenceEntry(id);
                      if (refEntry) return refEntry.displayValue;
                      const catEntry = getEntry(id);
                      if (catEntry) return catEntry.displayValue;
                      return id;
                    };

                    // Проверяем, похоже ли значение на ID записи
                    const looksLikeId = (val: unknown): boolean =>
                      typeof val === 'string' && (val.startsWith('entry-') || val.startsWith('catentry-'));

                    const isRefType = fieldDef?.type === 'reference' || fieldDef?.type === 'catalog_ref';

                    if (isRefType || looksLikeId(fieldValue.value)) {
                      if (Array.isArray(fieldValue.value)) {
                        displayValue = fieldValue.value
                          .map((id) => typeof id === 'string' && looksLikeId(id) ? resolveId(id) : String(id))
                          .join(', ');
                      } else if (fieldValue.value) {
                        displayValue = looksLikeId(fieldValue.value)
                          ? resolveId(String(fieldValue.value))
                          : String(fieldValue.value);
                      } else {
                        displayValue = '-';
                      }
                    } else {
                      displayValue = Array.isArray(fieldValue.value)
                        ? fieldValue.value.join(', ')
                        : String(fieldValue.value || '-');
                    }

                    // Если имя поля не найдено в каталоге — не показываем сырые ID
                    const fieldLabel = fieldDef?.name;
                    if (!fieldLabel && fieldValue.fieldId.startsWith('field-')) {
                      // Поле удалено из каталога — не отображаем
                      return null;
                    }

                    return (
                      <Box key={fieldValue.fieldId} sx={{ mb: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{ color: '#999', display: 'block', mb: 0.25 }}
                        >
                          {fieldLabel || fieldValue.fieldId}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#333' }}>
                          {displayValue}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
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
            mt: 1,
            minWidth: 400,
            maxWidth: 500,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <CatalogFieldSelect
            catalogId={catalogId}
            value={value}
            onChange={handleChange}
            multiple={multiple}
            onCreateNew={onCreateNew}
            onEdit={onEdit}
          />
        </Box>
      </Popover>
    </>
  );
};
