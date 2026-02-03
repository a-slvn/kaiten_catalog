import { useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
  Paper,
  IconButton,
  Stack,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Link as LinkIcon,
  Numbers as NumbersIcon,
  Contacts as ContactsIcon,
  TextFields as TextFieldsIcon,
  FormatListBulleted as ListIcon,
  Receipt as ReceiptIcon,
  FolderOpen as FolderOpenIcon,
} from '@mui/icons-material';
import { useCatalogs } from '../context/CatalogsContext';
import { useReferenceEntries } from '../context/ReferenceEntriesContext';
import { useDealsContext } from '../context/DealsContext';
import { Catalog, CatalogFieldDef, CatalogEntry, Deal } from '../types';

interface CatalogEntryDetailDialogProps {
  open: boolean;
  onClose: () => void;
  catalog: Catalog;
  entryId: string;
  onEdit: () => void;
}

export const CatalogEntryDetailDialog = ({
  open,
  onClose,
  catalog,
  entryId,
  onEdit,
}: CatalogEntryDetailDialogProps) => {
  const { getEntry, deleteEntry, getCatalog: getCatalogById } = useCatalogs();
  const { getEntry: getReferenceEntry } = useReferenceEntries();
  const { getDealsForEntryWithLinked } = useDealsContext();

  const entry = getEntry(entryId);

  // Извлекаем ID контактов из полей типа reference
  const linkedContactIds = useMemo((): string[] => {
    if (!entry) return [];

    const contactIds: string[] = [];

    catalog.fields.forEach((fieldDef) => {
      if (fieldDef.type === 'reference') {
        const fieldValue = entry.fields.find((f) => f.fieldId === fieldDef.id);
        if (fieldValue?.value) {
          if (Array.isArray(fieldValue.value)) {
            contactIds.push(...(fieldValue.value as string[]));
          } else if (typeof fieldValue.value === 'string') {
            contactIds.push(fieldValue.value);
          }
        }
      }
    });

    return contactIds;
  }, [entry, catalog.fields]);

  // Получаем сделки для компании и её контактов
  const relatedDeals = useMemo((): Deal[] => {
    if (!entry) return [];
    return getDealsForEntryWithLinked(entry.id, linkedContactIds);
  }, [entry, linkedContactIds, getDealsForEntryWithLinked]);

  if (!entry) {
    return null;
  }

  const handleDelete = () => {
    if (window.confirm('Вы уверены, что хотите удалить эту запись?')) {
      deleteEntry(entryId);
      onClose();
    }
  };

  // Получаем иконку для типа поля
  const getFieldIcon = (type: string) => {
    const iconStyle = { fontSize: 18, color: '#7B1FA2' };
    switch (type) {
      case 'email':
        return <EmailIcon sx={iconStyle} />;
      case 'phone':
        return <PhoneIcon sx={iconStyle} />;
      case 'url':
        return <LinkIcon sx={iconStyle} />;
      case 'numeric':
        return <NumbersIcon sx={iconStyle} />;
      case 'reference':
        return <ContactsIcon sx={iconStyle} />;
      case 'catalog_ref':
        return <FolderOpenIcon sx={iconStyle} />;
      case 'select':
      case 'multiselect':
        return <ListIcon sx={iconStyle} />;
      default:
        return <TextFieldsIcon sx={iconStyle} />;
    }
  };

  // Рендер значения поля
  const renderFieldValue = (fieldDef: CatalogFieldDef, entry: CatalogEntry) => {
    const fieldValue = entry.fields.find((f) => f.fieldId === fieldDef.id);
    if (!fieldValue || fieldValue.value === null || fieldValue.value === '') {
      return (
        <Typography variant="body2" sx={{ color: '#999', fontStyle: 'italic' }}>
          Не указано
        </Typography>
      );
    }

    const value = fieldValue.value;

    switch (fieldDef.type) {
      case 'email':
        return (
          <Typography
            variant="body2"
            component="a"
            href={`mailto:${value}`}
            sx={{ color: '#1976d2', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            {String(value)}
          </Typography>
        );

      case 'phone':
        return (
          <Typography
            variant="body2"
            component="a"
            href={`tel:${value}`}
            sx={{ color: '#1976d2', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            {String(value)}
          </Typography>
        );

      case 'url':
        return (
          <Typography
            variant="body2"
            component="a"
            href={String(value)}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: '#1976d2', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            {String(value)}
          </Typography>
        );

      case 'numeric':
        return (
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {value.toLocaleString('ru-RU')}
          </Typography>
        );

      case 'select':
        return (
          <Chip
            label={String(value)}
            size="small"
            sx={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}
          />
        );

      case 'multiselect':
        if (Array.isArray(value) && value.length > 0) {
          return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {value.map((v, i) => (
                <Chip
                  key={i}
                  label={String(v)}
                  size="small"
                  sx={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}
                />
              ))}
            </Box>
          );
        }
        return (
          <Typography variant="body2" sx={{ color: '#999', fontStyle: 'italic' }}>
            Не выбрано
          </Typography>
        );

      case 'reference':
        if (Array.isArray(value) && value.length > 0) {
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {value.map((id, i) => {
                const refEntry = getReferenceEntry(id as string);
                return (
                  <ReferenceCard key={i} entry={refEntry} entryId={id as string} />
                );
              })}
            </Box>
          );
        }
        if (typeof value === 'string' && value) {
          const refEntry = getReferenceEntry(value);
          return <ReferenceCard entry={refEntry} entryId={value} />;
        }
        return (
          <Typography variant="body2" sx={{ color: '#999', fontStyle: 'italic' }}>
            Не выбрано
          </Typography>
        );

      case 'catalog_ref':
        if (Array.isArray(value) && value.length > 0) {
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {value.map((id, i) => {
                const catEntry = getEntry(id as string);
                return (
                  <CatalogRefCard key={i} entry={catEntry} entryId={id as string} fieldDef={fieldDef} getCatalog={getCatalogById} />
                );
              })}
            </Box>
          );
        }
        if (typeof value === 'string' && value) {
          const catEntry = getEntry(value);
          return <CatalogRefCard entry={catEntry} entryId={value} fieldDef={fieldDef} getCatalog={getCatalogById} />;
        }
        return (
          <Typography variant="body2" sx={{ color: '#999', fontStyle: 'italic' }}>
            Не выбрано
          </Typography>
        );

      default:
        return (
          <Typography variant="body2">
            {String(value)}
          </Typography>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Рендер секции сделок
  const renderDealsSection = () => {
    if (relatedDeals.length === 0) {
      return null;
    }

    return (
      <Box sx={{ mt: 3 }}>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <ReceiptIcon sx={{ fontSize: 18, color: '#7B1FA2' }} />
          <Typography variant="subtitle2" sx={{ color: '#666' }}>
            Связанные сделки ({relatedDeals.length})
          </Typography>
        </Box>

        <Stack spacing={1.5}>
          {relatedDeals.map((deal) => (
            <Paper
              key={deal.id}
              elevation={0}
              sx={{
                p: 1.5,
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                backgroundColor: '#fafafa',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: deal.avatarColor || '#7B1FA2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ReceiptIcon sx={{ color: 'white', fontSize: 20 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                    {deal.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    {deal.orderNumber && `${deal.orderNumber} • `}
                    {deal.createdDate && new Date(deal.createdDate).toLocaleDateString('ru-RU')}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {deal.amount?.toLocaleString('ru-RU')} ₽
                  </Typography>
                  <Chip
                    label={deal.status}
                    size="small"
                    color={
                      deal.status === 'Выиграно'
                        ? 'success'
                        : deal.status === 'Потеряно'
                          ? 'error'
                          : 'default'
                    }
                  />
                </Box>
              </Box>
            </Paper>
          ))}
        </Stack>
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {entry.displayValue}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box>
          {/* Метаинформация */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#999' }}>
              Создано: {formatDate(entry.createdAt)}
              {entry.updatedAt !== entry.createdAt && ` | Обновлено: ${formatDate(entry.updatedAt)}`}
            </Typography>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Поля */}
          {catalog.fields.map((fieldDef) => (
            <Box key={fieldDef.id} sx={{ mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                {getFieldIcon(fieldDef.type)}
                <Typography variant="subtitle2" sx={{ color: '#666' }}>
                  {fieldDef.name}
                  {fieldDef.required && <span style={{ color: '#d32f2f' }}> *</span>}
                </Typography>
              </Box>
              <Box sx={{ pl: 3.5 }}>
                {renderFieldValue(fieldDef, entry)}
              </Box>
            </Box>
          ))}

          {/* Связанные сделки */}
          {renderDealsSection()}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button
          startIcon={<DeleteIcon />}
          onClick={handleDelete}
          sx={{ color: '#d32f2f', textTransform: 'none' }}
        >
          Удалить
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose} sx={{ textTransform: 'none' }}>
            Закрыть
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={onEdit}
            sx={{
              backgroundColor: '#7B1FA2',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#6A1B9A',
              },
            }}
          >
            Редактировать
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

// Компонент карточки связанной записи
interface ReferenceCardProps {
  entry: any | undefined;
  entryId: string;
}

// Компонент карточки связанной записи каталога
interface CatalogRefCardProps {
  entry: CatalogEntry | undefined;
  entryId: string;
  fieldDef: CatalogFieldDef;
  getCatalog: (id: string) => Catalog | undefined;
}

const CatalogRefCard = ({ entry, entryId, fieldDef, getCatalog }: CatalogRefCardProps) => {
  const targetCatalog = fieldDef.targetCatalogId
    ? getCatalog(fieldDef.targetCatalogId)
    : undefined;

  if (!entry) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          backgroundColor: '#fafafa',
        }}
      >
        <Typography variant="body2" sx={{ color: '#999' }}>
          Запись не найдена (ID: {entryId})
        </Typography>
      </Paper>
    );
  }

  // Получаем определение полей из целевого каталога для отображения
  const displayFields = targetCatalog
    ? entry.fields.slice(0, 3).map((f) => {
        const def = targetCatalog.fields.find((fd) => fd.id === f.fieldId);
        return { fieldName: def?.name || f.fieldId, value: f.value };
      })
    : [];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        backgroundColor: '#fafafa',
        '&:hover': {
          backgroundColor: '#f5f5f5',
          borderColor: '#7B1FA2',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <FolderOpenIcon sx={{ fontSize: 16, color: '#7B1FA2' }} />
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {entry.displayValue}
        </Typography>
      </Box>
      {displayFields.length > 0 && (
        <Typography variant="caption" sx={{ color: '#666', pl: 3 }}>
          {displayFields
            .map((f) => {
              const val = Array.isArray(f.value) ? f.value.join(', ') : f.value;
              return `${f.fieldName}: ${val}`;
            })
            .join(' | ')}
        </Typography>
      )}
    </Paper>
  );
};

const ReferenceCard = ({ entry, entryId }: ReferenceCardProps) => {
  if (!entry) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          backgroundColor: '#fafafa',
        }}
      >
        <Typography variant="body2" sx={{ color: '#999' }}>
          Запись не найдена (ID: {entryId})
        </Typography>
      </Paper>
    );
  }

  // Берем первые 3 поля для отображения
  const displayFields = entry.fields?.slice(0, 3) || [];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        backgroundColor: '#fafafa',
        '&:hover': {
          backgroundColor: '#f5f5f5',
          borderColor: '#7B1FA2',
        },
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
        {entry.displayValue}
      </Typography>
      {displayFields.length > 0 && (
        <Typography variant="caption" sx={{ color: '#666' }}>
          {displayFields
            .map((f: any) => {
              const val = Array.isArray(f.value) ? f.value.join(', ') : f.value;
              return `${f.fieldName}: ${val}`;
            })
            .join(' | ')}
        </Typography>
      )}
    </Paper>
  );
};
