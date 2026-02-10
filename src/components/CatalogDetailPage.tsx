import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Tooltip,
  InputAdornment,
  TableSortLabel,
  Popover,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FolderOpen as FolderOpenIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useCatalogs } from '../context/CatalogsContext';
import { useReferenceEntries } from '../context/ReferenceEntriesContext';
import { useDealsContext } from '../context/DealsContext';
import { CreateCatalogEntryDialog } from './CreateCatalogEntryDialog';
import { CatalogEntryDetailDialog } from './CatalogEntryDetailDialog';
import { DealModal } from './DealModal';
import { CatalogEntry, CatalogFieldDef } from '../types';

interface CatalogDetailPageProps {
  catalogId: string;
  onBack: () => void;
  onOpenCatalog?: (catalogId: string, entryId?: string) => void;
  entryIdToOpen?: string | null;
  onEntryOpened?: () => void;
}

type SortDirection = 'asc' | 'desc';

export const CatalogDetailPage = ({
  catalogId,
  onBack,
  onOpenCatalog,
  entryIdToOpen,
  onEntryOpened,
}: CatalogDetailPageProps) => {
  const { getCatalog, getEntriesByCatalog, deleteEntry, getEntry: getCatalogEntry } = useCatalogs();
  const { getEntry: getReferenceEntry } = useReferenceEntries();
  const { deals } = useDealsContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>('displayValue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [hiddenFields, setHiddenFields] = useState<Set<string>>(new Set());
  const [settingsAnchor, setSettingsAnchor] = useState<null | HTMLElement>(null);
  const [entryIdToDelete, setEntryIdToDelete] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  const catalog = getCatalog(catalogId);
  const entries = getEntriesByCatalog(catalogId);

  // Фильтрация по поисковому запросу
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) {
      return entries;
    }

    const query = searchQuery.toLowerCase();
    return entries.filter((entry) => {
      // Поиск по displayValue
      if (entry.displayValue.toLowerCase().includes(query)) {
        return true;
      }

      // Поиск по всем полям
      return entry.fields.some((field) => {
        const value = field.value;
        if (value === null) return false;
        if (Array.isArray(value)) {
          return value.some((v) => String(v).toLowerCase().includes(query));
        }
        return String(value).toLowerCase().includes(query);
      });
    });
  }, [entries, searchQuery]);

  // Сортировка
  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      if (sortField === 'displayValue') {
        aValue = a.displayValue;
        bValue = b.displayValue;
      } else {
        const aField = a.fields.find((f) => f.fieldId === sortField);
        const bField = b.fields.find((f) => f.fieldId === sortField);
        aValue = aField?.value ? String(aField.value) : '';
        bValue = bField?.value ? String(bField.value) : '';
      }

      if (sortDirection === 'asc') {
        return String(aValue).localeCompare(String(bValue));
      }
      return String(bValue).localeCompare(String(aValue));
    });
  }, [filteredEntries, sortField, sortDirection]);

  const visibleFields = useMemo(() => {
    if (!catalog) return [];
    return catalog.fields.filter((f) => !hiddenFields.has(f.id));
  }, [catalog, hiddenFields]);

  const toggleFieldVisibility = (fieldId: string) => {
    setHiddenFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldId)) {
        next.delete(fieldId);
      } else {
        next.add(fieldId);
      }
      return next;
    });
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCreateEntry = () => {
    setEditingEntryId(null);
    setCreateDialogOpen(true);
  };

  const handleEditEntry = (entryId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingEntryId(entryId);
    setCreateDialogOpen(true);
  };

  const handleDeleteEntry = (entryId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setEntryIdToDelete(entryId);
  };

  const handleConfirmDeleteEntry = () => {
    if (!entryIdToDelete) {
      return;
    }

    deleteEntry(entryIdToDelete);
    setEntryIdToDelete(null);
  };

  const handleOpenDetail = (entryId: string) => {
    setSelectedEntryId(entryId);
    setDetailDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setEditingEntryId(null);
  };

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedEntryId(null);
  };

  const handleEditFromDetail = () => {
    if (selectedEntryId) {
      setDetailDialogOpen(false);
      setEditingEntryId(selectedEntryId);
      setCreateDialogOpen(true);
    }
  };

  const handleOpenDeal = (dealId: string) => {
    setSelectedDealId(dealId);
  };

  const handleCloseDeal = () => {
    setSelectedDealId(null);
  };

  const handleOpenCatalogEntry = (targetCatalogId: string, targetEntryId: string) => {
    if (targetCatalogId === catalogId) {
      setSelectedEntryId(targetEntryId);
      setDetailDialogOpen(true);
      return;
    }

    setDetailDialogOpen(false);
    onOpenCatalog?.(targetCatalogId, targetEntryId);
  };

  // Получение отображаемого значения поля
  const getFieldDisplayValue = (entry: CatalogEntry, fieldDef: CatalogFieldDef): string => {
    const fieldValue = entry.fields.find((f) => f.fieldId === fieldDef.id);
    if (!fieldValue || fieldValue.value === null) {
      return '-';
    }

    const value = fieldValue.value;

    // Для справочников - показываем displayValue связанных записей
    if (fieldDef.type === 'reference') {
      if (Array.isArray(value)) {
        const names = value.map((id) => {
          const refEntry = getReferenceEntry(id as string);
          return refEntry?.displayValue || id;
        });
        return names.join(', ') || '-';
      }
      const refEntry = getReferenceEntry(value as string);
      return refEntry?.displayValue || String(value);
    }

    // Для ссылок на каталоги - показываем displayValue связанных записей каталога
    if (fieldDef.type === 'catalog_ref') {
      if (Array.isArray(value)) {
        const names = value.map((id) => {
          const catEntry = getCatalogEntry(id as string);
          return catEntry?.displayValue || id;
        });
        return names.join(', ') || '-';
      }
      const catEntry = getCatalogEntry(value as string);
      return catEntry?.displayValue || String(value);
    }

    // Для массивов
    if (Array.isArray(value)) {
      return value.join(', ') || '-';
    }

    return String(value);
  };

  if (!catalog) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Каталог не найден</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mt: 2 }}>
          Назад к каталогам
        </Button>
      </Box>
    );
  }

  const entryToDelete = entryIdToDelete
    ? entries.find((entry) => entry.id === entryIdToDelete)
    : null;
  const selectedDeal = deals.find((deal) => deal.id === selectedDealId) || null;

  useEffect(() => {
    if (!entryIdToOpen) {
      return;
    }

    setSelectedEntryId(entryIdToOpen);
    setDetailDialogOpen(true);
    onEntryOpened?.();
  }, [entryIdToOpen, onEntryOpened]);

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={onBack} sx={{ color: '#666' }}>
          <ArrowBackIcon />
        </IconButton>
        <FolderOpenIcon sx={{ fontSize: 32, color: '#7B1FA2' }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#212121' }}>
            {catalog.name}
          </Typography>
          <Typography variant="body2" sx={{ color: '#666' }}>
            {entries.length} записей, {catalog.fields.length} полей
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateEntry}
          sx={{
            backgroundColor: '#7B1FA2',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#6A1B9A',
            },
          }}
        >
          Добавить запись
        </Button>
      </Box>

      {/* Search + Settings */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          placeholder="Поиск по всем полям..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ width: 400 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#999' }} />
              </InputAdornment>
            ),
          }}
        />
        <Tooltip title="Настроить столбцы">
          <IconButton
            onClick={(e) => setSettingsAnchor(e.currentTarget)}
            sx={{ color: '#666' }}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>
        <Popover
          open={Boolean(settingsAnchor)}
          anchorEl={settingsAnchor}
          onClose={() => setSettingsAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          PaperProps={{ sx: { p: 2, minWidth: 220, maxHeight: 400 } }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
            Видимые столбцы
          </Typography>
          {catalog?.fields.map((field) => (
            <FormControlLabel
              key={field.id}
              control={
                <Checkbox
                  size="small"
                  checked={!hiddenFields.has(field.id)}
                  onChange={() => toggleFieldVisibility(field.id)}
                />
              }
              label={field.name}
              sx={{ display: 'flex', mr: 0 }}
            />
          ))}
        </Popover>
      </Box>

      {/* Table */}
      {sortedEntries.length > 0 ? (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', overflowX: 'auto' }}>
          <Table sx={{ minWidth: 'max-content' }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#fafafa' }}>
                {visibleFields.map((fieldDef) => (
                  <TableCell key={fieldDef.id} sx={{ fontWeight: 600, minWidth: 150, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortField === fieldDef.id}
                      direction={sortField === fieldDef.id ? sortDirection : 'asc'}
                      onClick={() => handleSort(fieldDef.id)}
                    >
                      {fieldDef.name}
                    </TableSortLabel>
                  </TableCell>
                ))}
                <TableCell sx={{ fontWeight: 600, width: 100 }}>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedEntries.map((entry) => (
                <TableRow
                  key={entry.id}
                  hover
                  onClick={() => handleOpenDetail(entry.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  {visibleFields.map((fieldDef) => (
                    <TableCell key={fieldDef.id} sx={{ whiteSpace: 'nowrap' }}>
                      {fieldDef.type === 'reference' ? (
                        <Chip
                          label={getFieldDisplayValue(entry, fieldDef)}
                          size="small"
                          sx={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}
                        />
                      ) : fieldDef.type === 'catalog_ref' ? (
                        <Chip
                          label={getFieldDisplayValue(entry, fieldDef)}
                          size="small"
                          sx={{ backgroundColor: '#f3e5f5', color: '#7B1FA2' }}
                        />
                      ) : fieldDef.type === 'email' ? (
                        <Typography
                          variant="body2"
                          component="a"
                          href={`mailto:${getFieldDisplayValue(entry, fieldDef)}`}
                          sx={{ color: '#1976d2', textDecoration: 'none' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {getFieldDisplayValue(entry, fieldDef)}
                        </Typography>
                      ) : fieldDef.type === 'url' ? (
                        <Typography
                          variant="body2"
                          component="a"
                          href={getFieldDisplayValue(entry, fieldDef)}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ color: '#1976d2', textDecoration: 'none' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {getFieldDisplayValue(entry, fieldDef)}
                        </Typography>
                      ) : fieldDef.type === 'phone' ? (
                        <Typography
                          variant="body2"
                          component="a"
                          href={`tel:${getFieldDisplayValue(entry, fieldDef)}`}
                          sx={{ color: '#1976d2', textDecoration: 'none' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {getFieldDisplayValue(entry, fieldDef)}
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#424242' }}>
                          {getFieldDisplayValue(entry, fieldDef)}
                        </Typography>
                      )}
                    </TableCell>
                  ))}
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Редактировать">
                        <IconButton
                          size="small"
                          onClick={(e) => handleEditEntry(entry.id, e)}
                          sx={{ color: '#666' }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Удалить">
                        <IconButton
                          size="small"
                          onClick={(e) => handleDeleteEntry(entry.id, e)}
                          sx={{ color: '#d32f2f' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            border: '1px dashed #ccc',
            borderRadius: 2,
            backgroundColor: '#fafafa',
          }}
        >
          {searchQuery ? (
            <>
              <SearchIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
                Ничего не найдено
              </Typography>
              <Typography variant="body2" sx={{ color: '#999' }}>
                Попробуйте изменить поисковый запрос
              </Typography>
            </>
          ) : (
            <>
              <FolderOpenIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
                Нет записей
              </Typography>
              <Typography variant="body2" sx={{ color: '#999', mb: 3 }}>
                Добавьте первую запись в каталог
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleCreateEntry}
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
                Добавить запись
              </Button>
            </>
          )}
        </Paper>
      )}

      {/* Create/Edit Entry Dialog */}
      {catalog && (
        <CreateCatalogEntryDialog
          open={createDialogOpen}
          onClose={handleCloseCreateDialog}
          catalog={catalog}
          editingEntryId={editingEntryId}
        />
      )}

      {/* Entry Detail Dialog */}
      {catalog && selectedEntryId && (
        <CatalogEntryDetailDialog
          open={detailDialogOpen}
          onClose={handleCloseDetailDialog}
          catalog={catalog}
          entryId={selectedEntryId}
          onEdit={handleEditFromDetail}
          onOpenCatalogEntry={handleOpenCatalogEntry}
          onOpenDeal={handleOpenDeal}
        />
      )}

      <DealModal
        open={Boolean(selectedDealId)}
        onClose={handleCloseDeal}
        deal={selectedDeal}
      />

      <Dialog
        open={Boolean(entryIdToDelete)}
        onClose={() => setEntryIdToDelete(null)}
        aria-labelledby="confirm-delete-catalog-entry-title"
      >
        <DialogTitle id="confirm-delete-catalog-entry-title">Удалить запись?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Запись "{entryToDelete?.displayValue || 'без названия'}" будет удалена без возможности восстановления.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEntryIdToDelete(null)} sx={{ textTransform: 'none' }}>
            Отмена
          </Button>
          <Button onClick={handleConfirmDeleteEntry} color="error" variant="contained" sx={{ textTransform: 'none' }}>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
