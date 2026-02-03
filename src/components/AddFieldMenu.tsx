import { useState, useMemo } from 'react';
import {
  Popover,
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  Label as LabelIcon,
  Checklist as ChecklistIcon,
  Link as LinkIcon,
  UploadFile as UploadFileIcon,
  AccountTree as AccountTreeIcon,
  Star as StarIcon,
  CloudQueue as CloudIcon,
  Search as SearchIcon,
  Add as AddIcon,
  TextFields as TextFieldsIcon,
  Numbers as NumbersIcon,
  FormatListBulleted as ListIcon,
  Contacts as ContactsIcon,
  CalendarMonth as DateIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { useCustomFields, CustomFieldDefinition } from '../context/CustomFieldsContext';
import { AddCustomFieldModal } from './AddCustomFieldModal';

interface AddFieldMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onAddField: (fieldId: string) => void;
}

// Встроенные поля для раздела "Основное"
const BASIC_FIELDS = [
  { id: 'deadline', name: 'Срок', icon: AccessTimeIcon },
  { id: 'labels', name: 'Метки', icon: LabelIcon },
  { id: 'checklist', name: 'Чек-лист', icon: ChecklistIcon },
  { id: 'link', name: 'Ссылка', icon: LinkIcon },
  { id: 'file', name: 'Загрузить файл', icon: UploadFileIcon },
];

// Поля для раздела "Связи"
const RELATION_FIELDS = [
  { id: 'parent', name: 'Родительская карточка', icon: AccountTreeIcon },
  { id: 'child', name: 'Дочерняя карточка', icon: AccountTreeIcon },
];

// Поля для раздела "Остальное"
const OTHER_FIELDS = [
  { id: 'acceptance', name: 'Критерии приёмки', icon: StarIcon },
  { id: 'gdrive', name: 'Google Drive', icon: CloudIcon },
  { id: 'dropbox', name: 'Dropbox', icon: CloudIcon },
];

// Иконки для типов полей
const getFieldTypeIcon = (type: string) => {
  switch (type) {
    case 'string':
    case 'text':
      return TextFieldsIcon;
    case 'number':
    case 'numeric':
      return NumbersIcon;
    case 'date':
      return DateIcon;
    case 'select':
    case 'multiselect':
      return ListIcon;
    case 'reference':
      return ContactsIcon;
    case 'catalog':
      return FolderIcon;
    default:
      return TextFieldsIcon;
  }
};

export const AddFieldMenu = ({
  anchorEl,
  open,
  onClose,
  onAddField,
}: AddFieldMenuProps) => {
  const { fieldDefinitions, addFieldDefinition } = useCustomFields();
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Фильтрация активных полей по поисковому запросу
  const filteredFields = useMemo(() => {
    const activeFields = fieldDefinitions.filter((f) => f.active);
    if (!searchQuery.trim()) return activeFields;
    return activeFields.filter((f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [fieldDefinitions, searchQuery]);

  const handleFieldClick = (field: CustomFieldDefinition) => {
    onAddField(field.id);
    onClose();
  };

  const handleOpenCreateModal = () => {
    setCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setCreateModalOpen(false);
  };

  const handleCreateField = (field: Omit<CustomFieldDefinition, 'id' | 'createdAt' | 'author' | 'active'>) => {
    addFieldDefinition(field);
    setCreateModalOpen(false);
  };

  const activeFieldsCount = fieldDefinitions.filter((f) => f.active).length;

  return (
    <>
      <Popover
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
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
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            mt: 1,
            overflow: 'hidden',
          },
        }}
      >
        <Box sx={{ display: 'flex', minWidth: 520, maxHeight: 450 }}>
          {/* Левая панель - Основное, Связи, Остальное */}
          <Box sx={{ width: 240, borderRight: '1px solid #e0e0e0', overflowY: 'auto' }}>
            {/* Основное */}
            <Typography
              variant="caption"
              sx={{ px: 2, pt: 2, pb: 1, display: 'block', color: '#666', fontWeight: 500 }}
            >
              Основное
            </Typography>
            <List dense disablePadding>
              {BASIC_FIELDS.map((field) => (
                <ListItemButton
                  key={field.id}
                  sx={{ py: 0.75, px: 2, '&:hover': { backgroundColor: '#f5f5f5' } }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <field.icon sx={{ fontSize: '1.25rem', color: '#666' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={field.name}
                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                  />
                </ListItemButton>
              ))}
            </List>

            {/* Связи */}
            <Typography
              variant="caption"
              sx={{ px: 2, pt: 2, pb: 1, display: 'block', color: '#666', fontWeight: 500 }}
            >
              Связи
            </Typography>
            <List dense disablePadding>
              {RELATION_FIELDS.map((field) => (
                <ListItemButton
                  key={field.id}
                  sx={{ py: 0.75, px: 2, '&:hover': { backgroundColor: '#f5f5f5' } }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <field.icon sx={{ fontSize: '1.25rem', color: '#666' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={field.name}
                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                  />
                </ListItemButton>
              ))}
            </List>

            {/* Остальное */}
            <Typography
              variant="caption"
              sx={{ px: 2, pt: 2, pb: 1, display: 'block', color: '#666', fontWeight: 500 }}
            >
              Остальное
            </Typography>
            <List dense disablePadding>
              {OTHER_FIELDS.map((field) => (
                <ListItemButton
                  key={field.id}
                  sx={{ py: 0.75, px: 2, '&:hover': { backgroundColor: '#f5f5f5' } }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <field.icon sx={{ fontSize: '1.25rem', color: '#666' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={field.name}
                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Box>

          {/* Правая панель - Поля */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography
              variant="caption"
              sx={{ px: 2, pt: 2, pb: 1, display: 'block', color: '#666', fontWeight: 500 }}
            >
              Поля
            </Typography>

            {/* Поиск */}
            <Box sx={{ px: 2, pb: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Найти.."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: '1.25rem', color: '#999' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: '0.875rem',
                  },
                }}
              />
            </Box>

            {/* Создать новое поле */}
            <ListItemButton
              onClick={handleOpenCreateModal}
              sx={{ py: 1, px: 2, '&:hover': { backgroundColor: '#f5f5f5' } }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <AddIcon sx={{ fontSize: '1.25rem', color: '#666' }} />
              </ListItemIcon>
              <ListItemText
                primary="Создать новое поле"
                primaryTypographyProps={{ fontSize: '0.875rem' }}
              />
            </ListItemButton>

            <Divider sx={{ mx: 2 }} />

            {/* Список пользовательских полей из контекста */}
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              <List dense disablePadding>
                {filteredFields.map((field) => {
                  const IconComponent = getFieldTypeIcon(field.type);
                  return (
                    <ListItemButton
                      key={field.id}
                      onClick={() => handleFieldClick(field)}
                      sx={{ py: 0.75, px: 2, '&:hover': { backgroundColor: '#f5f5f5' } }}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <IconComponent sx={{ fontSize: '1.25rem', color: '#666' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={field.name}
                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                      />
                    </ListItemButton>
                  );
                })}

                {/* Если нет полей вообще */}
                {activeFieldsCount === 0 && (
                  <Box sx={{ px: 2, py: 3, color: '#999', fontSize: '0.875rem', textAlign: 'center' }}>
                    Нет пользовательских полей.
                    <br />
                    Создайте новое поле.
                  </Box>
                )}

                {/* Если ничего не найдено по поиску */}
                {filteredFields.length === 0 && searchQuery && activeFieldsCount > 0 && (
                  <Box sx={{ px: 2, py: 3, color: '#999', fontSize: '0.875rem', textAlign: 'center' }}>
                    Ничего не найдено
                  </Box>
                )}
              </List>
            </Box>
          </Box>
        </Box>
      </Popover>

      {/* Модалка создания нового поля */}
      <AddCustomFieldModal
        open={createModalOpen}
        onClose={handleCloseCreateModal}
        onAdd={handleCreateField}
      />
    </>
  );
};
