export type DealStatus = 'В работе' | 'Выиграно' | 'Потеряно';

// Типы кастомных полей
export type FieldType =
  | 'text'           // Текстовое поле
  | 'email'          // Email (рабочий)
  | 'phone'          // Телефон (рабочий)
  | 'messenger'      // Мессенджер (мультитекстовое)
  | 'url'            // URL адрес
  | 'numeric'        // Числовое поле
  | 'select'         // Выпадающий список
  | 'multiselect'    // Мульти выбор
  | 'smart_address'  // Адрес
  | 'textarea'       // Многострочное текстовое поле
  | 'reference'      // Справочник (ссылка на другую сущность)
  | 'catalog';       // Каталог (ссылка на запись каталога - Компании, Контакты)

// Типы справочников (сущностей, на которые можно ссылаться)
export type ReferenceType = 'deal' | 'custom';

export interface ReferenceConfig {
  referenceType: ReferenceType;      // Тип сущности
  customReferenceId?: string;        // ID кастомного справочника (если referenceType === 'custom')
  customReferenceName?: string;      // Название кастомного справочника
  multiple?: boolean;                // Можно ли выбрать несколько значений
}

// Конфигурация для поля типа catalog
export interface CatalogConfig {
  catalogId: string;                  // ID каталога
  catalogName: string;                // Название каталога (для отображения)
  multiple?: boolean;                 // Можно ли выбрать несколько значений
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface CustomField {
  id: string;
  type: FieldType;
  name: string;           // Название поля (отображаемое)
  value: string | number | string[];  // Значение (для reference/catalog - это ID сущности или массив ID)
  options?: SelectOption[];  // Опции для select
  referenceConfig?: ReferenceConfig;  // Конфигурация для типа reference
  catalogConfig?: CatalogConfig;      // Конфигурация для типа catalog
  placeholder?: string;
  required?: boolean;
}

export interface FieldDefinition {
  type: FieldType;
  label: string;
  description: string;
  icon?: string;
}

// Предустановленные определения типов полей
export const FIELD_TYPES: FieldDefinition[] = [
  { type: 'text', label: 'Текст', description: 'Однострочное текстовое поле' },
  { type: 'email', label: 'Email', description: 'Поле для email адреса' },
  { type: 'phone', label: 'Телефон', description: 'Поле для номера телефона' },
  { type: 'messenger', label: 'Мессенджер', description: 'Поле для мессенджера (Telegram, WhatsApp и т.д.)' },
  { type: 'url', label: 'URL', description: 'Поле для веб-адреса' },
  { type: 'numeric', label: 'Число', description: 'Числовое поле' },
  { type: 'select', label: 'Список', description: 'Выпадающий список с вариантами' },
  { type: 'smart_address', label: 'Адрес', description: 'Поле для адреса' },
  { type: 'textarea', label: 'Текстовая область', description: 'Многострочное текстовое поле' },
  { type: 'reference', label: 'Справочник', description: 'Ссылка на сделку или кастомный справочник' },
  { type: 'catalog', label: 'Каталог', description: 'Ссылка на запись каталога (Компании, Контакты)' },
];

// Предустановленные типы справочников
export const REFERENCE_TYPES: { type: ReferenceType; label: string; description: string }[] = [
  { type: 'deal', label: 'Сделка', description: 'Ссылка на сделку' },
  { type: 'custom', label: 'Кастомный справочник', description: 'Ссылка на пользовательский справочник' },
];

export interface Deal {
  id: string;
  title: string;
  amount: number;
  status: DealStatus;
  avatarColor: string;
  columnId: string;
  orderNumber?: string;
  customer?: string;
  createdDate?: string;
  movedDate?: string;
  description?: string;
  assignee?: string;
  type?: string;
}

export interface Column {
  id: string;
  title: string;
  deals: Deal[];
}

export type ColumnId = 'new' | 'qualification' | 'proposal' | 'negotiation' | 'paid' | 'lost';

// ============================================
// НОВЫЕ ТИПЫ ДЛЯ СВЯЗЕЙ МЕЖДУ СПРАВОЧНИКАМИ
// ============================================

// Значение поля в записи справочника
export interface ReferenceFieldValue {
  fieldId: string;           // ID определения поля
  fieldName: string;         // Название поля (для удобства)
  fieldType: FieldType;      // Тип поля
  value: string | number | string[];  // Значение поля (для reference - ID другой записи)
}

// Запись в справочнике (например, запись Компании или Клиента)
export interface ReferenceEntry {
  id: string;                          // Уникальный ID записи
  referenceDefinitionId: string;       // ID справочника, к которому принадлежит запись
  displayValue: string;                // Отображаемое значение (первое обязательное поле)
  fields: ReferenceFieldValue[];       // Значения всех полей
  createdAt: string;                   // Дата создания
  updatedAt: string;                   // Дата обновления
  createdBy: string;                   // Кто создал
}

// Информация о том, где используется запись
export interface ReferenceUsage {
  type: 'deal' | 'reference';          // Тип сущности, которая использует запись
  entityId: string;                    // ID сущности (сделки или другой записи)
  entityName: string;                  // Название сущности (для отображения)
  fieldName: string;                   // В каком поле используется
}

// Детальная информация о записи для страницы просмотра
export interface ReferenceEntryDetail extends ReferenceEntry {
  linkedEntries: {                     // Связанные записи из других справочников
    [referenceDefinitionId: string]: ReferenceEntry[];
  };
  usedIn: ReferenceUsage[];            // Где используется эта запись
}

// ============================================
// ТИПЫ ДЛЯ КАТАЛОГОВ
// ============================================

// Типы полей каталога
export type CatalogFieldType =
  | 'text'        // Строка
  | 'url'         // Ссылка
  | 'email'       // Email
  | 'phone'       // Телефон
  | 'select'      // Селект
  | 'multiselect' // Мультиселект
  | 'numeric'     // Число
  | 'reference'   // Справочник (ссылка на существующие справочники)
  | 'catalog_ref'; // Каталог (ссылка на записи другого каталога)

// Определение поля каталога
export interface CatalogFieldDef {
  id: string;
  name: string;
  type: CatalogFieldType;
  required: boolean;
  options?: string[];           // Для select/multiselect - варианты выбора
  referenceId?: string;         // Для type='reference' - ID справочника
  referenceName?: string;       // Название справочника (для отображения)
  multiple?: boolean;           // Множественный выбор для reference и catalog_ref
  targetCatalogId?: string;     // Для type='catalog_ref' - ID целевого каталога
  targetCatalogName?: string;   // Название целевого каталога (для отображения)
  customFieldId?: string;       // ID пользовательского поля (если поле из существующих)
}

// Каталог (схема)
export interface Catalog {
  id: string;
  name: string;
  fields: CatalogFieldDef[];
  isMultiple?: boolean;           // Можно ли выбрать несколько записей из этого каталога
  isEditable?: boolean;           // Можно ли редактировать записи каталога из карточки
  createdAt: string;
  updatedAt: string;
}

// Значение поля в записи каталога
export interface CatalogFieldValue {
  fieldId: string;
  value: string | string[] | number | null;
}

// Запись в каталоге
export interface CatalogEntry {
  id: string;
  catalogId: string;
  displayValue: string;         // Основное отображаемое значение
  fields: CatalogFieldValue[];
  createdAt: string;
  updatedAt: string;
}
