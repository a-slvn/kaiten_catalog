import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FolderOpen as FolderOpenIcon,
} from '@mui/icons-material';
import { useCatalogs } from '../context/CatalogsContext';
import { CreateCatalogDialog } from './CreateCatalogDialog';

interface CatalogsPageProps {
  onOpenCatalog: (catalogId: string) => void;
}

export const CatalogsPage = ({ onOpenCatalog }: CatalogsPageProps) => {
  const { catalogs, deleteCatalog, getEntriesByCatalog } = useCatalogs();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCatalogId, setEditingCatalogId] = useState<string | null>(null);
  const [catalogIdToDelete, setCatalogIdToDelete] = useState<string | null>(null);

  const handleCreateCatalog = () => {
    setEditingCatalogId(null);
    setCreateDialogOpen(true);
  };

  const handleEditCatalog = (catalogId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingCatalogId(catalogId);
    setCreateDialogOpen(true);
  };

  const handleDeleteCatalog = (catalogId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setCatalogIdToDelete(catalogId);
  };

  const handleConfirmDeleteCatalog = () => {
    if (!catalogIdToDelete) {
      return;
    }

    deleteCatalog(catalogIdToDelete);
    setCatalogIdToDelete(null);
  };

  const handleCloseDialog = () => {
    setCreateDialogOpen(false);
    setEditingCatalogId(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const catalogToDelete = catalogIdToDelete
    ? catalogs.find((catalog) => catalog.id === catalogIdToDelete)
    : null;
  const catalogEntriesToDelete = catalogToDelete ? getEntriesByCatalog(catalogToDelete.id).length : 0;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FolderOpenIcon sx={{ fontSize: 32, color: '#7B1FA2' }} />
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#212121' }}>
            Каталоги
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateCatalog}
          sx={{
            backgroundColor: '#7B1FA2',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#6A1B9A',
            },
          }}
        >
          Создать каталог
        </Button>
      </Box>

      {/* Description */}
      <Typography variant="body2" sx={{ color: '#666', mb: 3 }}>
        Каталоги позволяют создавать собственные справочники с настраиваемыми полями.
        Например, каталог "Компании" с полями: Название, Контакты, Телефон.
      </Typography>

      {/* Catalogs Table */}
      {catalogs.length > 0 ? (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#fafafa' }}>
                <TableCell sx={{ fontWeight: 600 }}>Название</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Полей</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Записей</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Дата создания</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 100 }}>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {catalogs.map((catalog) => {
                const entriesCount = getEntriesByCatalog(catalog.id).length;
                return (
                  <TableRow
                    key={catalog.id}
                    hover
                    onClick={() => onOpenCatalog(catalog.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FolderOpenIcon sx={{ fontSize: 20, color: '#7B1FA2' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {catalog.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={catalog.fields.length}
                        size="small"
                        sx={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={entriesCount}
                        size="small"
                        sx={{ backgroundColor: '#e8f5e9', color: '#388e3c' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        {formatDate(catalog.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Редактировать">
                          <IconButton
                            size="small"
                            onClick={(e) => handleEditCatalog(catalog.id, e)}
                            sx={{ color: '#666' }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Удалить">
                          <IconButton
                            size="small"
                            onClick={(e) => handleDeleteCatalog(catalog.id, e)}
                            sx={{ color: '#d32f2f' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
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
          <FolderOpenIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
            Нет каталогов
          </Typography>
          <Typography variant="body2" sx={{ color: '#999', mb: 3 }}>
            Создайте первый каталог для хранения данных
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleCreateCatalog}
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
            Создать каталог
          </Button>
        </Paper>
      )}

      {/* Create/Edit Dialog */}
      <CreateCatalogDialog
        open={createDialogOpen}
        onClose={handleCloseDialog}
        editingCatalogId={editingCatalogId}
      />

      <Dialog
        open={Boolean(catalogIdToDelete)}
        onClose={() => setCatalogIdToDelete(null)}
        aria-labelledby="confirm-delete-catalog-title"
      >
        <DialogTitle id="confirm-delete-catalog-title">Удалить каталог?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Каталог "{catalogToDelete?.name || 'без названия'}" и все его записи ({catalogEntriesToDelete}) будут удалены без
            возможности восстановления.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCatalogIdToDelete(null)} sx={{ textTransform: 'none' }}>
            Отмена
          </Button>
          <Button onClick={handleConfirmDeleteCatalog} color="error" variant="contained" sx={{ textTransform: 'none' }}>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
