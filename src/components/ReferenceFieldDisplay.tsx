import { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { ReferenceFieldDef, useCustomFields } from '../context/CustomFieldsContext';
import { ReferenceFieldSelect } from './ReferenceFieldSelect';
import { useReferenceEntries } from '../context/ReferenceEntriesContext';
import { useCatalogs } from '../context/CatalogsContext';

interface Props {
  fieldDef: ReferenceFieldDef;
  value: string | string[] | null;
  onChange: (value: string | string[]) => void;
  onCreateNew?: () => void;
  onEdit?: (entryId: string, referenceId: string) => void;
}

export const ReferenceFieldDisplay = ({
  fieldDef,
  value,
  onChange,
  onCreateNew,
  onEdit,
}: Props) => {
  const { getEntry } = useReferenceEntries();
  const { getEntry: getCatalogEntry } = useCatalogs();
  const { fieldDefinitions } = useCustomFields();

  const selectedIds = useMemo(() => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  const selectedEntries = useMemo(() => {
    return selectedIds.map((id) => getEntry(id)).filter((e) => e);
  }, [selectedIds, getEntry]);

  return (
    <Box>
      <ReferenceFieldSelect
        fieldDef={fieldDef}
        referenceDefinitionId={fieldDef.targetReferenceId || ''}
        value={value}
        onChange={onChange}
        onCreateNew={onCreateNew}
        onEdit={onEdit}
      />

      {selectedEntries.map((entry) => {
        // Ищем определение справочника для резолва имён полей
        const refDef = fieldDefinitions.find((f) => f.id === entry!.referenceDefinitionId);

        return entry!.fields.length > 0 && (
          <Box key={entry!.id} sx={{ mt: 1, pl: 1.5 }}>
            {entry!.fields.map((field) => {
              let displayValue: string;

              // Резолвим ссылки на записи справочников
              const resolveEntryId = (id: string): string => {
                const refEntry = getEntry(id);
                if (refEntry) return refEntry.displayValue;
                const catEntry = getCatalogEntry(id);
                if (catEntry) return catEntry.displayValue;
                return id;
              };

              if (field.fieldType === 'reference' || field.fieldType === 'catalog') {
                if (Array.isArray(field.value)) {
                  displayValue = field.value
                    .map((refId) => resolveEntryId(refId as string))
                    .join(', ');
                } else if (field.value) {
                  displayValue = resolveEntryId(String(field.value));
                } else {
                  displayValue = '-';
                }
              } else {
                displayValue = Array.isArray(field.value)
                  ? field.value.join(', ')
                  : String(field.value || '-');
              }

              // Резолвим имя поля: используем сохранённое имя, но если оно похоже на ID — ищем в определении
              let fieldLabel = field.fieldName;
              if (!fieldLabel || fieldLabel.startsWith('field-')) {
                const fieldDefInRef = refDef?.referenceFields?.find((f) => f.id === field.fieldId);
                if (fieldDefInRef) {
                  fieldLabel = fieldDefInRef.name;
                }
              }

              return (
                <Box key={field.fieldId} sx={{ mb: 0.5 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: '#999', mr: 0.5 }}
                  >
                    {fieldLabel}:
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: '#333' }}
                  >
                    {displayValue}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
};
