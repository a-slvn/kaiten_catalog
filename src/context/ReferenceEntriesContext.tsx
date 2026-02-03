import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import {
  ReferenceEntry,
  ReferenceUsage,
  ReferenceEntryDetail,
} from '../types';
import { useCustomFields } from './CustomFieldsContext';

interface ReferenceEntriesContextType {
  entries: ReferenceEntry[];

  // CRUD операции с записями
  addEntry: (entry: Omit<ReferenceEntry, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => string;
  updateEntry: (id: string, updates: Partial<Omit<ReferenceEntry, 'id' | 'createdAt'>>) => void;
  deleteEntry: (id: string) => void;

  // Получение записей
  getEntry: (id: string) => ReferenceEntry | undefined;
  getEntriesByReference: (referenceDefinitionId: string) => ReferenceEntry[];
  getEntryDetail: (id: string) => ReferenceEntryDetail | undefined;

  // Работа со связями
  getLinkedEntries: (entryId: string, targetReferenceId: string) => ReferenceEntry[];
  getEntriesWhereFieldEquals: (referenceDefinitionId: string, fieldId: string, value: string) => ReferenceEntry[];

  // Информация об использовании
  getUsageInfo: (entryId: string) => ReferenceUsage[];
}

const ReferenceEntriesContext = createContext<ReferenceEntriesContextType | undefined>(undefined);

export const useReferenceEntries = () => {
  const context = useContext(ReferenceEntriesContext);
  if (!context) {
    throw new Error('useReferenceEntries must be used within a ReferenceEntriesProvider');
  }
  return context;
};

interface ReferenceEntriesProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'crm_reference_entries';

export const ReferenceEntriesProvider = ({ children }: ReferenceEntriesProviderProps) => {
  // Инициализация из localStorage
  const [entries, setEntries] = useState<ReferenceEntry[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load entries from localStorage:', error);
      return [];
    }
  });
  const { fieldDefinitions } = useCustomFields();

  // Сохранение в localStorage при изменении
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to save entries to localStorage:', error);
    }
  }, [entries]);

  // Создание новой записи
  const addEntry = useCallback((
    entry: Omit<ReferenceEntry, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ): string => {
    const now = new Date().toISOString();
    const newEntry: ReferenceEntry = {
      ...entry,
      id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
      createdBy: 'Текущий пользователь',
    };

    setEntries((prev) => [...prev, newEntry]);
    return newEntry.id;
  }, []);

  // Обновление записи
  const updateEntry = useCallback((
    id: string,
    updates: Partial<Omit<ReferenceEntry, 'id' | 'createdAt'>>
  ) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? { ...entry, ...updates, updatedAt: new Date().toISOString() }
          : entry
      )
    );
  }, []);

  // Удаление записи
  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  // Получение записи по ID
  const getEntry = useCallback((id: string): ReferenceEntry | undefined => {
    return entries.find((entry) => entry.id === id);
  }, [entries]);

  // Получение всех записей определенного справочника
  const getEntriesByReference = useCallback((referenceDefinitionId: string): ReferenceEntry[] => {
    return entries.filter((entry) => entry.referenceDefinitionId === referenceDefinitionId);
  }, [entries]);

  // Получение связанных записей
  // Например: получить всех Клиентов, у которых поле "Компания" = <id компании>
  const getLinkedEntries = useCallback((
    entryId: string,
    targetReferenceId: string
  ): ReferenceEntry[] => {
    return entries.filter((entry) => {
      if (entry.referenceDefinitionId !== targetReferenceId) {
        return false;
      }

      // Проверяем, есть ли в полях ссылка на наш entryId
      return entry.fields.some((field) => {
        if (field.fieldType !== 'reference') {
          return false;
        }

        // Поддержка как single, так и multiple значений
        if (Array.isArray(field.value)) {
          return field.value.includes(entryId);
        }
        return field.value === entryId;
      });
    });
  }, [entries]);

  // Получение записей, где определенное поле равно значению
  const getEntriesWhereFieldEquals = useCallback((
    referenceDefinitionId: string,
    fieldId: string,
    value: string
  ): ReferenceEntry[] => {
    return entries.filter((entry) => {
      if (entry.referenceDefinitionId !== referenceDefinitionId) {
        return false;
      }

      const field = entry.fields.find((f) => f.fieldId === fieldId);
      if (!field) {
        return false;
      }

      if (Array.isArray(field.value)) {
        return field.value.includes(value);
      }
      return field.value === value;
    });
  }, [entries]);

  // Получение информации об использовании записи
  const getUsageInfo = useCallback((entryId: string): ReferenceUsage[] => {
    const usages: ReferenceUsage[] = [];

    // Ищем во всех записях, которые ссылаются на эту
    entries.forEach((entry) => {
      entry.fields.forEach((field) => {
        if (field.fieldType !== 'reference') {
          return;
        }

        const hasReference = Array.isArray(field.value)
          ? field.value.includes(entryId)
          : field.value === entryId;

        if (hasReference) {
          usages.push({
            type: 'reference',
            entityId: entry.id,
            entityName: entry.displayValue,
            fieldName: field.fieldName,
          });
        }
      });
    });

    // TODO: Добавить поиск использования в сделках (deals)
    // Это нужно будет реализовать, когда добавим интеграцию с DealModal

    return usages;
  }, [entries]);

  // Получение детальной информации о записи
  const getEntryDetail = useCallback((id: string): ReferenceEntryDetail | undefined => {
    const entry = getEntry(id);
    if (!entry) {
      return undefined;
    }

    // Находим все связанные записи из других справочников
    const linkedEntries: { [referenceDefinitionId: string]: ReferenceEntry[] } = {};

    // 1. ПРЯМЫЕ СВЯЗИ: записи, на которые ссылается текущая запись через свои поля
    entry.fields.forEach((field) => {
      if (field.fieldType === 'reference' && field.value) {
        // Получаем определение текущего справочника
        const currentRefDef = fieldDefinitions.find((def) => def.id === entry.referenceDefinitionId);

        // Находим определение поля внутри справочника
        const refFieldDef = currentRefDef?.referenceFields?.find((rf) => rf.id === field.fieldId);

        if (refFieldDef?.type === 'reference' && refFieldDef.targetReferenceId) {
          // Получаем ID целевого справочника
          const targetRefId = refFieldDef.targetReferenceId;

          // Получаем записи по ID (поддерживаем как single, так и multiple)
          const entryIds = Array.isArray(field.value) ? field.value : [field.value];

          entryIds.forEach((entryId) => {
            const linkedEntry = getEntry(entryId as string);
            if (linkedEntry) {
              if (!linkedEntries[targetRefId]) {
                linkedEntries[targetRefId] = [];
              }
              // Проверяем, что запись еще не добавлена (избегаем дубликатов)
              if (!linkedEntries[targetRefId].some((e) => e.id === linkedEntry.id)) {
                linkedEntries[targetRefId].push(linkedEntry);
              }
            }
          });
        }
      }
    });

    // 2. ОБРАТНЫЕ СВЯЗИ: записи, которые ссылаются на текущую запись
    fieldDefinitions.forEach((def) => {
      if (def.type === 'reference') {
        const linked = getLinkedEntries(id, def.id);
        if (linked.length > 0) {
          // Объединяем с уже найденными записями (если есть)
          if (!linkedEntries[def.id]) {
            linkedEntries[def.id] = [];
          }
          linked.forEach((entry) => {
            // Проверяем, что запись еще не добавлена (избегаем дубликатов)
            if (!linkedEntries[def.id].some((e) => e.id === entry.id)) {
              linkedEntries[def.id].push(entry);
            }
          });
        }
      }
    });

    return {
      ...entry,
      linkedEntries,
      usedIn: getUsageInfo(id),
    };
  }, [entries, fieldDefinitions, getEntry, getLinkedEntries, getUsageInfo]);

  return (
    <ReferenceEntriesContext.Provider
      value={{
        entries,
        addEntry,
        updateEntry,
        deleteEntry,
        getEntry,
        getEntriesByReference,
        getEntryDetail,
        getLinkedEntries,
        getEntriesWhereFieldEquals,
        getUsageInfo,
      }}
    >
      {children}
    </ReferenceEntriesContext.Provider>
  );
};
