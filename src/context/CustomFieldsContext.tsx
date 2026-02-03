import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { FieldType } from '../types';

// Field definition within a reference type custom field
export interface ReferenceFieldDef {
  id: string;
  name: string;
  type: FieldType;
  required: boolean;
  // Для полей типа 'reference' - на какой справочник ссылается
  targetReferenceId?: string;      // ID справочника, на который ссылается это поле
  targetReferenceName?: string;     // Название справочника (для удобства)
  cascadeFilter?: boolean;          // Автоматически фильтровать связанные записи
}

// Custom field definition (created in admin panel)
export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: 'string' | 'reference' | 'date' | 'number' | 'select' | 'multiselect' | 'catalog';
  showOnCardFacade: boolean;
  usersCanAddValues: boolean;
  valuesCanHaveColor: boolean;
  selectedColor?: string;
  referenceFields?: ReferenceFieldDef[];
  // Для справочников (type === 'reference') - режим выбора
  isMultipleSelection?: boolean; // true = множественный выбор, false/undefined = одиночный
  // Для каталогов (type === 'catalog')
  catalogId?: string;           // ID привязанного каталога
  catalogName?: string;         // Название каталога (для отображения)
  isCatalogMultiple?: boolean;  // Множественный выбор записей каталога
  createdAt: string;
  author: string;
  active: boolean;
}

interface CustomFieldsContextType {
  fieldDefinitions: CustomFieldDefinition[];
  addFieldDefinition: (field: Omit<CustomFieldDefinition, 'id' | 'createdAt' | 'author' | 'active'>) => void;
  updateFieldDefinition: (id: string, updates: Partial<CustomFieldDefinition>) => void;
  deleteFieldDefinition: (id: string) => void;
  deactivateFieldDefinition: (id: string) => void;
  activateFieldDefinition: (id: string) => void;
}

const CustomFieldsContext = createContext<CustomFieldsContextType | undefined>(undefined);

export const useCustomFields = () => {
  const context = useContext(CustomFieldsContext);
  if (!context) {
    throw new Error('useCustomFields must be used within a CustomFieldsProvider');
  }
  return context;
};

interface CustomFieldsProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'crm_field_definitions';

export const CustomFieldsProvider = ({ children }: CustomFieldsProviderProps) => {
  // Инициализация из localStorage
  const [fieldDefinitions, setFieldDefinitions] = useState<CustomFieldDefinition[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load field definitions from localStorage:', error);
      return [];
    }
  });

  // Сохранение в localStorage при изменении
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fieldDefinitions));
    } catch (error) {
      console.error('Failed to save field definitions to localStorage:', error);
    }
  }, [fieldDefinitions]);

  const addFieldDefinition = (
    field: Omit<CustomFieldDefinition, 'id' | 'createdAt' | 'author' | 'active'>
  ) => {
    const newField: CustomFieldDefinition = {
      ...field,
      id: `field-${Date.now()}`,
      createdAt: new Date().toISOString(),
      author: 'Текущий пользователь',
      active: true,
    };
    setFieldDefinitions((prev) => [...prev, newField]);
  };

  const updateFieldDefinition = (id: string, updates: Partial<CustomFieldDefinition>) => {
    setFieldDefinitions((prev) =>
      prev.map((field) => (field.id === id ? { ...field, ...updates } : field))
    );
  };

  const deleteFieldDefinition = (id: string) => {
    setFieldDefinitions((prev) => prev.filter((field) => field.id !== id));
  };

  const deactivateFieldDefinition = (id: string) => {
    updateFieldDefinition(id, { active: false });
  };

  const activateFieldDefinition = (id: string) => {
    updateFieldDefinition(id, { active: true });
  };

  return (
    <CustomFieldsContext.Provider
      value={{
        fieldDefinitions,
        addFieldDefinition,
        updateFieldDefinition,
        deleteFieldDefinition,
        deactivateFieldDefinition,
        activateFieldDefinition,
      }}
    >
      {children}
    </CustomFieldsContext.Provider>
  );
};
