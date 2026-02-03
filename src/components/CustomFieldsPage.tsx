import { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search,
  Add,
  ContentCopy,
  Delete,
  Edit,
  TextFields as TextIcon,
  AccountTree as ReferenceIcon,
  CalendarMonth as DateIcon,
  Numbers as NumericIcon,
  List as SelectIcon,
} from '@mui/icons-material';
import { AddCustomFieldModal } from './AddCustomFieldModal';
import { useCustomFields, CustomFieldDefinition } from '../context/CustomFieldsContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`custom-fields-tabpanel-${index}`}
      aria-labelledby={`custom-fields-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const getFieldTypeIcon = (type: string) => {
  switch (type) {
    case 'string':
      return <TextIcon fontSize="small" sx={{ color: '#9E9E9E' }} />;
    case 'reference':
      return <ReferenceIcon fontSize="small" sx={{ color: '#9E9E9E' }} />;
    case 'date':
      return <DateIcon fontSize="small" sx={{ color: '#9E9E9E' }} />;
    case 'number':
      return <NumericIcon fontSize="small" sx={{ color: '#9E9E9E' }} />;
    case 'select':
    case 'multiselect':
      return <SelectIcon fontSize="small" sx={{ color: '#9E9E9E' }} />;
    default:
      return <TextIcon fontSize="small" sx={{ color: '#9E9E9E' }} />;
  }
};

const getFieldTypeLabel = (type: string) => {
  switch (type) {
    case 'string':
      return 'Строка';
    case 'reference':
      return 'Справочник';
    case 'date':
      return 'Дата';
    case 'number':
      return 'Число';
    case 'select':
      return 'Селект';
    case 'multiselect':
      return 'Мульти селект';
    default:
      return type;
  }
};

export const CustomFieldsPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [progressField, setProgressField] = useState('sum');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  const { fieldDefinitions, addFieldDefinition, updateFieldDefinition, deactivateFieldDefinition, activateFieldDefinition, deleteFieldDefinition } =
    useCustomFields();

  const fieldToEdit = editingFieldId
    ? fieldDefinitions.find(f => f.id === editingFieldId)
    : undefined;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddField = (field: Omit<CustomFieldDefinition, 'id' | 'createdAt' | 'author' | 'active'>) => {
    addFieldDefinition(field);
  };

  const handleEditField = (fieldId: string) => {
    setEditingFieldId(fieldId);
    setAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setAddModalOpen(false);
    setEditingFieldId(null);
  };

  // Filter fields based on active status and search query
  const activeFields = fieldDefinitions.filter(
    (f) =>
      f.active &&
      (searchQuery === '' || f.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const deactivatedFields = fieldDefinitions.filter(
    (f) =>
      !f.active &&
      (searchQuery === '' || f.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderFieldsTable = (fields: CustomFieldDefinition[], isActive: boolean) => {
    if (fields.length === 0) {
      return (
        <TableBody>
          <TableRow>
            <TableCell colSpan={7} sx={{ border: 0, py: 8 }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: '#F5F5F5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  <TextIcon sx={{ fontSize: 40, color: '#BDBDBD' }} />
                </Box>
                <Typography variant="h6" sx={{ color: '#424242', mb: 1 }}>
                  {isActive ? 'Пользовательских полей пока нет' : 'Деактивированных полей нет'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#9E9E9E', textAlign: 'center', maxWidth: 400 }}>
                  {isActive
                    ? 'Создайте пользовательское поле, чтобы добавить дополнительную информацию к карточкам'
                    : 'Здесь будут отображаться поля, которые были деактивированы'}
                </Typography>
              </Box>
            </TableCell>
          </TableRow>
        </TableBody>
      );
    }

    return (
      <TableBody>
        {fields.map((field) => (
          <TableRow key={field.id} hover>
            <TableCell>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getFieldTypeIcon(field.type)}
                <Typography variant="body2">{field.name}</Typography>
              </Box>
            </TableCell>
            <TableCell>
              <Typography variant="body2" sx={{ color: '#757575' }}>
                #{field.id.replace('field-', '')}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2">{getFieldTypeLabel(field.type)}</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2">{field.showOnCardFacade ? 'Да' : 'Нет'}</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2">{field.author}</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2">Нет</Typography>
            </TableCell>
            <TableCell>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="Копировать">
                  <IconButton size="small" sx={{ color: '#9E9E9E' }}>
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>
                {isActive ? (
                  <>
                    <Tooltip title="Редактировать">
                      <IconButton
                        size="small"
                        sx={{ color: '#9E9E9E' }}
                        onClick={() => handleEditField(field.id)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Деактивировать">
                      <IconButton
                        size="small"
                        sx={{ color: '#9E9E9E' }}
                        onClick={() => deactivateFieldDefinition(field.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                ) : (
                  <>
                    <Tooltip title="Активировать">
                      <Button
                        size="small"
                        sx={{ color: '#7B1FA2', textTransform: 'none', minWidth: 'auto' }}
                        onClick={() => activateFieldDefinition(field.id)}
                      >
                        Активировать
                      </Button>
                    </Tooltip>
                    <Tooltip title="Удалить">
                      <IconButton
                        size="small"
                        sx={{ color: '#EF5350' }}
                        onClick={() => deleteFieldDefinition(field.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'uppercase',
              fontWeight: 500,
              fontSize: '0.875rem',
              letterSpacing: '0.02em',
              color: '#757575',
              '&.Mui-selected': {
                color: '#7B1FA2',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#7B1FA2',
            },
          }}
        >
          <Tab label={`Активные поля${activeFields.length > 0 ? ` (${activeFields.length})` : ''}`} />
          <Tab label={`Деактивированные поля${deactivatedFields.length > 0 ? ` (${deactivatedFields.length})` : ''}`} />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, p: 3 }}>
        <TabPanel value={tabValue} index={0}>
          {/* Progress field selector */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 3,
              p: 2,
              backgroundColor: '#FAFAFA',
              borderRadius: 1,
              border: '1px solid #E0E0E0',
            }}
          >
            <Typography variant="body1" sx={{ color: '#424242' }}>
              Поле для отображения прогресса в карточках
            </Typography>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Select
                value={progressField}
                onChange={(e) => setProgressField(e.target.value)}
                sx={{
                  backgroundColor: '#fff',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#E0E0E0',
                  },
                }}
              >
                <MenuItem value="sum">Сумма чисел</MenuItem>
                <MenuItem value="count">Количество</MenuItem>
                <MenuItem value="percent">Процент</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Search and Add button row */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 3,
            }}
          >
            <TextField
              placeholder="Найти.."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                width: 400,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                  '& fieldset': {
                    borderColor: '#E0E0E0',
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#9E9E9E' }} />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setAddModalOpen(true)}
              sx={{
                borderColor: '#7B1FA2',
                color: '#7B1FA2',
                textTransform: 'uppercase',
                fontWeight: 500,
                '&:hover': {
                  borderColor: '#6A1B9A',
                  backgroundColor: 'rgba(123, 31, 162, 0.04)',
                },
              }}
            >
              Добавить пользовательское поле
            </Button>
          </Box>

          {/* Table */}
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 500, color: '#757575', borderBottom: '2px solid #E0E0E0' }}>
                  Название
                </TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#757575', borderBottom: '2px solid #E0E0E0' }}>
                  ID
                </TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#757575', borderBottom: '2px solid #E0E0E0' }}>
                  Тип
                </TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#757575', borderBottom: '2px solid #E0E0E0' }}>
                  Виден на фасаде карточек
                </TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#757575', borderBottom: '2px solid #E0E0E0' }}>
                  Автор
                </TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#757575', borderBottom: '2px solid #E0E0E0' }}>
                  Использование ограничено
                </TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#757575', borderBottom: '2px solid #E0E0E0' }}>
                  Действия
                </TableCell>
              </TableRow>
            </TableHead>
            {renderFieldsTable(activeFields, true)}
          </Table>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Search for deactivated */}
          <Box sx={{ mb: 3 }}>
            <TextField
              placeholder="Найти.."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                width: 400,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                  '& fieldset': {
                    borderColor: '#E0E0E0',
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#9E9E9E' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Table for deactivated */}
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 500, color: '#757575', borderBottom: '2px solid #E0E0E0' }}>
                  Название
                </TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#757575', borderBottom: '2px solid #E0E0E0' }}>
                  ID
                </TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#757575', borderBottom: '2px solid #E0E0E0' }}>
                  Тип
                </TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#757575', borderBottom: '2px solid #E0E0E0' }}>
                  Виден на фасаде карточек
                </TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#757575', borderBottom: '2px solid #E0E0E0' }}>
                  Автор
                </TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#757575', borderBottom: '2px solid #E0E0E0' }}>
                  Использование ограничено
                </TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#757575', borderBottom: '2px solid #E0E0E0' }}>
                  Действия
                </TableCell>
              </TableRow>
            </TableHead>
            {renderFieldsTable(deactivatedFields, false)}
          </Table>
        </TabPanel>
      </Box>

      {/* Add Custom Field Modal */}
      <AddCustomFieldModal
        open={addModalOpen}
        onClose={handleCloseModal}
        onAdd={handleAddField}
        editMode={Boolean(editingFieldId)}
        fieldToEdit={fieldToEdit}
        onUpdate={updateFieldDefinition}
      />
    </Box>
  );
};
