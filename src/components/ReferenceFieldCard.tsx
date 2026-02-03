import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Collapse,
  Select,
  MenuItem,
  FormControl,
  Tooltip,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  InputLabel,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Contacts as ContactsIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import InputMask from 'react-input-mask';
import { CustomFieldDefinition, ReferenceFieldDef } from '../context/CustomFieldsContext';
import { FieldType } from '../types';
import { ReferenceFieldSelect } from './ReferenceFieldSelect';
import { CreateReferenceEntryDialog } from './CreateReferenceEntryDialog';
import ReferenceEntryDetailDialog from './ReferenceEntryDetailDialog';
import { useReferenceEntries } from '../context/ReferenceEntriesContext';

interface ReferenceFieldCardProps {
  field: CustomFieldDefinition;
  onDelete?: (fieldId: string) => void;
  onUpdateField?: (fieldId: string, updates: Partial<CustomFieldDefinition>) => void;
  onEdit?: (fieldId: string) => void;
}

// Типы полей для добавления (такие же как в AddCustomFieldModal)
const FIELD_TYPE_OPTIONS: { type: FieldType; label: string }[] = [
  { type: 'text', label: 'Строка' },
  { type: 'url', label: 'Ссылка' },
  { type: 'email', label: 'Email' },
  { type: 'phone', label: 'Телефон' },
  { type: 'select', label: 'Селект' },
  { type: 'multiselect', label: 'Мульти селект' },
  { type: 'numeric', label: 'Число' },
  { type: 'reference', label: 'Справочник' },
];

// Типы для renderFieldInput
interface RenderFieldInputProps {
  refField: ReferenceFieldDef;
  referenceDefinitionId: string;
  fieldValues: Record<string, string>;
  handleFieldChange: (fieldId: string, value: string) => void;
  setCreatingNewForField: (id: string | null) => void;
}

// Рендер поля в зависимости от типа
const renderFieldInput = ({
  refField,
  referenceDefinitionId,
  fieldValues,
  handleFieldChange,
  setCreatingNewForField,
}: RenderFieldInputProps) => {
  const commonSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      backgroundColor: '#fff',
    },
  };

  switch (refField.type) {
    case 'select':
    case 'multiselect':
      return (
        <FormControl fullWidth size="small">
          <Select displayEmpty defaultValue="" sx={commonSx}>
            <MenuItem value="" disabled>
              Выберите значение
            </MenuItem>
          </Select>
        </FormControl>
      );

    case 'numeric':
      return (
        <TextField
          fullWidth
          size="small"
          type="number"
          placeholder="0"
          variant="outlined"
          sx={commonSx}
        />
      );

    case 'email':
      return (
        <TextField
          fullWidth
          size="small"
          type="email"
          placeholder="email@example.com"
          variant="outlined"
          sx={commonSx}
        />
      );

    case 'phone':
      return (
        <InputMask mask="+7 (999) 999-99-99" maskChar="_">
          {(inputProps: any) => (
            <TextField
              {...inputProps}
              fullWidth
              size="small"
              type="tel"
              placeholder="+7 (___) ___-__-__"
              variant="outlined"
              sx={commonSx}
            />
          )}
        </InputMask>
      );

    case 'url':
      return (
        <TextField
          fullWidth
          size="small"
          type="url"
          placeholder="https://"
          variant="outlined"
          sx={commonSx}
        />
      );

    case 'textarea':
      return (
        <TextField
          fullWidth
          size="small"
          multiline
          rows={2}
          placeholder="Введите текст..."
          variant="outlined"
          sx={commonSx}
        />
      );

    case 'reference':
      return (
        <ReferenceFieldSelect
          fieldDef={refField}
          referenceDefinitionId={referenceDefinitionId}
          value={fieldValues[refField.id] || ''}
          onChange={(val) => handleFieldChange(refField.id, val as string)}
          onCreateNew={() => setCreatingNewForField(refField.targetReferenceId || null)}
          onEdit={(entryId) => {
            // Открыть диалог редактирования для выбранной записи
            // TODO: Implement edit dialog
            console.log('Edit entry:', entryId, 'in reference:', refField.targetReferenceId);
          }}
        />
      );

    case 'text':
    default:
      return (
        <TextField
          fullWidth
          size="small"
          placeholder={`Введите ${refField.name.toLowerCase()}`}
          variant="outlined"
          sx={commonSx}
        />
      );
  }
};

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
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export const ReferenceFieldCard = ({
  field,
  onDelete,
  onUpdateField,
  onEdit,
}: ReferenceFieldCardProps) => {
  const [expanded, setExpanded] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [addFieldDialogOpen, setAddFieldDialogOpen] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<FieldType>('text');
  const [creatingNewForField, setCreatingNewForField] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [createEntryDialogOpen, setCreateEntryDialogOpen] = useState(false);
  const [viewEntryId, setViewEntryId] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  const { getEntriesByReference, deleteEntry } = useReferenceEntries();
  const referenceFields = field.referenceFields || [];
  const entries = getEntriesByReference(field.id);

  const entryToEdit = editingEntryId
    ? entries.find(e => e.id === editingEntryId)
    : undefined;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(field.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(field.id);
  };

  const handleDeleteRefField = (refFieldId: string) => {
    const updatedFields = referenceFields.filter((f) => f.id !== refFieldId);
    onUpdateField?.(field.id, { referenceFields: updatedFields });
  };

  const handleAddField = () => {
    if (!newFieldName.trim()) return;

    const newField: ReferenceFieldDef = {
      id: `ref-field-${Date.now()}`,
      name: newFieldName.trim(),
      type: newFieldType,
      required: false,
    };

    const updatedFields = [...referenceFields, newField];
    onUpdateField?.(field.id, { referenceFields: updatedFields });

    // Сброс формы
    setNewFieldName('');
    setNewFieldType('text');
    setAddFieldDialogOpen(false);
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleEntryCreated = (entryId: string) => {
    // Установить созданную запись в поле
    if (creatingNewForField) {
      // Найти поле, для которого создавали запись
      const targetField = referenceFields.find(f => f.targetReferenceId === creatingNewForField);
      if (targetField) {
        handleFieldChange(targetField.id, entryId);
      }
    }
    setCreatingNewForField(null);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleDeleteEntry = (entryId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту запись?')) {
      deleteEntry(entryId);
    }
  };

  const handleViewEntry = (entryId: string) => {
    setViewEntryId(entryId);
  };

  const handleCreateEntrySuccess = () => {
    setCreateEntryDialogOpen(false);
  };

  return (
    <>
      <CreateReferenceEntryDialog
        open={Boolean(creatingNewForField)}
        referenceDefinitionId={creatingNewForField}
        onClose={() => setCreatingNewForField(null)}
        onCreate={handleEntryCreated}
      />
      <CreateReferenceEntryDialog
        open={createEntryDialogOpen}
        referenceDefinitionId={field.id}
        onClose={() => {
          setCreateEntryDialogOpen(false);
          setEditingEntryId(null);
        }}
        onCreate={handleCreateEntrySuccess}
        editMode={Boolean(editingEntryId)}
        entryToEdit={entryToEdit}
        onUpdate={() => {
          setEditingEntryId(null);
          setCreateEntryDialogOpen(false);
        }}
      />
      <ReferenceEntryDetailDialog
        open={Boolean(viewEntryId)}
        entryId={viewEntryId}
        onClose={() => setViewEntryId(null)}
        onNavigateToEntry={(entryId) => setViewEntryId(entryId)}
      />
      <Box
        sx={{
          mb: 2,
          border: '1px solid #e0e0e0',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {/* Header - сворачиваемый */}
        <Box
          onClick={() => setExpanded(!expanded)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.5,
            backgroundColor: field.selectedColor || '#f5f5f5',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: field.selectedColor ? field.selectedColor : '#eeeeee',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ContactsIcon sx={{ fontSize: '1.25rem', color: '#666' }} />
            <Typography variant="body2" sx={{ fontWeight: 500, color: '#333' }}>
              {field.name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#999' }}>
              ({referenceFields.length} {getFieldsWord(referenceFields.length)})
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {onEdit && (
              <Tooltip title="Редактировать справочник">
                <IconButton
                  size="small"
                  onClick={handleEdit}
                  sx={{
                    p: 0.5,
                    color: '#999',
                    '&:hover': {
                      color: '#7B1FA2',
                      backgroundColor: 'rgba(123, 31, 162, 0.08)',
                    },
                  }}
                >
                  <EditIcon sx={{ fontSize: '1.1rem' }} />
                </IconButton>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip title="Удалить поле из карточки">
                <IconButton
                  size="small"
                  onClick={handleDelete}
                  sx={{
                    p: 0.5,
                    color: '#999',
                    '&:hover': {
                      color: '#f44336',
                      backgroundColor: 'rgba(244, 67, 54, 0.08)',
                    },
                  }}
                >
                  <DeleteIcon sx={{ fontSize: '1.1rem' }} />
                </IconButton>
              </Tooltip>
            )}
            <IconButton size="small" sx={{ p: 0 }}>
              {expanded ? (
                <ExpandLessIcon sx={{ color: '#666' }} />
              ) : (
                <ExpandMoreIcon sx={{ color: '#666' }} />
              )}
            </IconButton>
          </Box>
        </Box>

        {/* Content - вкладки с полями и записями */}
        <Collapse in={expanded}>
          <Box sx={{ backgroundColor: '#fafafa' }}>
            {/* Вкладки */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={currentTab}
                onChange={handleTabChange}
                aria-label="Вкладки справочника"
                sx={{
                  '& .MuiTab-root': {
                    minHeight: 48,
                    textTransform: 'none',
                    fontSize: '0.875rem',
                  },
                }}
              >
                <Tab label="Поля" />
                <Tab
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      Записи
                      {entries.length > 0 && (
                        <Typography
                          component="span"
                          sx={{
                            fontSize: '0.75rem',
                            color: '#7B1FA2',
                            bgcolor: 'rgba(123, 31, 162, 0.1)',
                            px: 0.75,
                            py: 0.25,
                            borderRadius: 1,
                          }}
                        >
                          {entries.length}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </Tabs>
            </Box>

            {/* Вкладка "Поля" */}
            <TabPanel value={currentTab} index={0}>
              <Box sx={{ p: 2 }}>
                {referenceFields.length === 0 ? (
                  <Typography
                    variant="body2"
                    sx={{ color: '#999', fontStyle: 'italic', mb: 2 }}
                  >
                    Нет полей в справочнике
                  </Typography>
                ) : (
                  referenceFields.map((refField) => (
                    <Box key={refField.id} sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#666',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          {refField.name}
                          {refField.required && (
                            <Typography component="span" sx={{ color: '#f44336' }}>
                              *
                            </Typography>
                          )}
                        </Typography>
                        {onUpdateField && (
                          <Tooltip title="Удалить поле">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteRefField(refField.id)}
                              sx={{
                                p: 0.25,
                                color: '#bbb',
                                '&:hover': {
                                  color: '#f44336',
                                  backgroundColor: 'rgba(244, 67, 54, 0.08)',
                                },
                              }}
                            >
                              <DeleteIcon sx={{ fontSize: '1rem' }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                      {renderFieldInput({
                        refField,
                        referenceDefinitionId: field.id,
                        fieldValues,
                        handleFieldChange,
                        setCreatingNewForField,
                      })}
                    </Box>
                  ))
                )}

                {/* Кнопка добавления поля */}
                {onUpdateField && (
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => setAddFieldDialogOpen(true)}
                    size="small"
                    sx={{
                      color: '#7B1FA2',
                      textTransform: 'none',
                      mt: referenceFields.length > 0 ? 1 : 0,
                      '&:hover': {
                        backgroundColor: 'rgba(123, 31, 162, 0.08)',
                      },
                    }}
                  >
                    Добавить поле
                  </Button>
                )}
              </Box>
            </TabPanel>

            {/* Вкладка "Записи" */}
            <TabPanel value={currentTab} index={1}>
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setEditingEntryId(null);
                      setCreateEntryDialogOpen(true);
                    }}
                    size="small"
                    variant="contained"
                    sx={{
                      textTransform: 'none',
                      backgroundColor: '#7B1FA2',
                      '&:hover': {
                        backgroundColor: '#6A1B9A',
                      },
                    }}
                  >
                    Добавить запись
                  </Button>
                </Box>

                {entries.length === 0 ? (
                  <Box
                    sx={{
                      textAlign: 'center',
                      py: 4,
                      color: '#999',
                    }}
                  >
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Нет записей. Добавьте первую запись.
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                          <TableCell sx={{ fontWeight: 600 }}>Название</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Полей</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Дата создания</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>Действия</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {entries.map((entry) => (
                          <TableRow
                            key={entry.id}
                            sx={{
                              '&:hover': {
                                backgroundColor: '#f9f9f9',
                              },
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {entry.displayValue}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ color: '#666' }}>
                                {entry.fields.length}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ color: '#666' }}>
                                {new Date(entry.createdAt).toLocaleDateString('ru-RU')}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                <Tooltip title="Просмотр">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleViewEntry(entry.id)}
                                    sx={{
                                      color: '#7B1FA2',
                                      '&:hover': {
                                        backgroundColor: 'rgba(123, 31, 162, 0.08)',
                                      },
                                    }}
                                  >
                                    <VisibilityIcon sx={{ fontSize: '1.1rem' }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Редактировать">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setEditingEntryId(entry.id);
                                      setCreateEntryDialogOpen(true);
                                    }}
                                    sx={{
                                      color: '#666',
                                      '&:hover': {
                                        color: '#7B1FA2',
                                        backgroundColor: 'rgba(123, 31, 162, 0.08)',
                                      },
                                    }}
                                  >
                                    <EditIcon sx={{ fontSize: '1.1rem' }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Удалить">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteEntry(entry.id)}
                                    sx={{
                                      color: '#666',
                                      '&:hover': {
                                        color: '#f44336',
                                        backgroundColor: 'rgba(244, 67, 54, 0.08)',
                                      },
                                    }}
                                  >
                                    <DeleteIcon sx={{ fontSize: '1.1rem' }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </TabPanel>
          </Box>
        </Collapse>
      </Box>

      {/* Диалог добавления поля */}
      <Dialog
        open={addFieldDialogOpen}
        onClose={() => setAddFieldDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Добавить поле в справочник
          </Typography>

          <TextField
            fullWidth
            label="Название поля"
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
            sx={{ mb: 2 }}
            autoFocus
          />

          <FormControl fullWidth>
            <InputLabel>Тип поля</InputLabel>
            <Select
              value={newFieldType}
              onChange={(e) => setNewFieldType(e.target.value as FieldType)}
              label="Тип поля"
            >
              {FIELD_TYPE_OPTIONS.map((opt) => (
                <MenuItem key={opt.type} value={opt.type}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddFieldDialogOpen(false)} sx={{ color: '#666' }}>
            Отмена
          </Button>
          <Button
            onClick={handleAddField}
            disabled={!newFieldName.trim()}
            sx={{ color: '#7B1FA2' }}
          >
            Добавить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Склонение слова "поле"
function getFieldsWord(count: number): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return 'полей';
  }
  if (lastDigit === 1) {
    return 'поле';
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'поля';
  }
  return 'полей';
}
