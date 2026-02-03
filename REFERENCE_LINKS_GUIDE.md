# Связи между справочниками - Руководство

## Обзор

Теперь в системе реализована полноценная поддержка связей между справочниками, как в AmoCRM. Вы можете создавать справочники (Компания, Клиент, Товар и т.д.) и связывать их между собой.

## Ключевые возможности

### 1. Связи между справочниками

Поля справочника теперь могут быть типа "Справочник" и ссылаться на другие справочники.

**Пример**: В справочнике "Клиент" можно создать поле "Компания", которое ссылается на справочник "Компания".

### 2. Автоматическая каскадная фильтрация

При выборе записи из связанного справочника, другие справочники автоматически фильтруются.

**Пример**: Выбрали компанию "ООО Ромашка" в сделке → поле "Клиент" автоматически показывает только клиентов этой компании.

### 3. Детальный просмотр записей

Клик по записи справочника открывает страницу с тремя вкладками:
- **Информация**: все поля записи
- **Связанные**: записи из других справочников, которые ссылаются на эту
- **Сделки**: список сделок, где используется эта запись

### 4. Навигация между записями

Все ссылки на записи справочников кликабельны - можно переходить от компании к клиентам, от клиента к сделкам и обратно.

## Как использовать

### Шаг 1: Создание справочников

```typescript
// 1. Создайте справочник "Компания"
const companyRef = {
  name: "Компания",
  type: "reference",
  referenceFields: [
    { name: "Название", type: "text", required: true },
    { name: "ИНН", type: "numeric", required: false }
  ]
};

// 2. Создайте справочник "Клиент" со ссылкой на "Компания"
const clientRef = {
  name: "Клиент",
  type: "reference",
  referenceFields: [
    { name: "Имя", type: "text", required: true },
    { name: "Телефон", type: "phone", required: false },
    { name: "Email", type: "email", required: false },
    {
      name: "Компания",
      type: "reference",
      required: false,
      targetReferenceId: "<id-справочника-Компания>",  // ID справочника Компания
      targetReferenceName: "Компания",
      cascadeFilter: true  // Включить автофильтрацию
    }
  ]
};
```

### Шаг 2: Создание записей

```typescript
import { useReferenceEntries } from './context/ReferenceEntriesContext';

function MyComponent() {
  const { addEntry } = useReferenceEntries();

  // Создаем компанию
  const companyId = addEntry({
    referenceDefinitionId: "<id-справочника-Компания>",
    displayValue: "ООО Ромашка",
    fields: [
      { fieldId: "1", fieldName: "Название", fieldType: "text", value: "ООО Ромашка" },
      { fieldId: "2", fieldName: "ИНН", fieldType: "numeric", value: "1234567890" }
    ]
  });

  // Создаем клиента, связанного с компанией
  const clientId = addEntry({
    referenceDefinitionId: "<id-справочника-Клиент>",
    displayValue: "Иванов Иван",
    fields: [
      { fieldId: "1", fieldName: "Имя", fieldType: "text", value: "Иванов Иван" },
      { fieldId: "2", fieldName: "Телефон", fieldType: "phone", value: "+79001112233" },
      { fieldId: "3", fieldName: "Email", fieldType: "email", value: "ivanov@example.com" },
      { fieldId: "4", fieldName: "Компания", fieldType: "reference", value: companyId }  // Ссылка на компанию
    ]
  });
}
```

### Шаг 3: Использование ReferenceFieldSelect

Компонент для выбора записей из справочника с автофильтрацией:

```tsx
import { ReferenceFieldSelect } from './components/ReferenceFieldSelect';

function DealForm() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  return (
    <>
      {/* Выбор компании */}
      <ReferenceFieldSelect
        fieldDef={companyFieldDef}
        referenceDefinitionId="deal"
        value={companyId}
        onChange={setCompanyId}
        onOpenDetail={(id) => console.log('Открыть компанию:', id)}
      />

      {/* Выбор клиента - автоматически фильтруется по выбранной компании */}
      <ReferenceFieldSelect
        fieldDef={clientFieldDef}
        referenceDefinitionId="deal"
        value={clientId}
        onChange={setClientId}
        filterByField={{
          fieldId: "company-field-id",
          value: companyId || ''
        }}
        onOpenDetail={(id) => console.log('Открыть клиента:', id)}
      />
    </>
  );
}
```

### Шаг 4: Детальный просмотр записи

```tsx
import { ReferenceEntryDetailDialog } from './components/ReferenceEntryDetailDialog';

function App() {
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  return (
    <>
      <button onClick={() => setSelectedEntryId('entry-123')}>
        Открыть компанию
      </button>

      <ReferenceEntryDetailDialog
        open={Boolean(selectedEntryId)}
        entryId={selectedEntryId}
        onClose={() => setSelectedEntryId(null)}
        onNavigateToEntry={(entryId) => setSelectedEntryId(entryId)}  // Навигация между записями
      />
    </>
  );
}
```

## API

### ReferenceEntriesContext

```typescript
// Создание записи
const entryId = addEntry({
  referenceDefinitionId: string,
  displayValue: string,
  fields: ReferenceFieldValue[]
});

// Обновление записи
updateEntry(entryId, { displayValue: "Новое название" });

// Удаление записи
deleteEntry(entryId);

// Получение записи
const entry = getEntry(entryId);

// Получение всех записей справочника
const entries = getEntriesByReference(referenceDefinitionId);

// Получение детальной информации (со связями)
const detail = getEntryDetail(entryId);

// Получение связанных записей
// Например: получить всех клиентов компании
const linkedEntries = getLinkedEntries(companyId, clientReferenceId);

// Фильтрация по полю
// Например: найти всех клиентов, у которых поле "Компания" = companyId
const filtered = getEntriesWhereFieldEquals(
  clientReferenceId,
  companyFieldId,
  companyId
);

// Информация об использовании
const usage = getUsageInfo(entryId);  // Где используется запись
```

## Архитектура

### Новые типы

```typescript
// Значение поля в записи
interface ReferenceFieldValue {
  fieldId: string;
  fieldName: string;
  fieldType: FieldType;
  value: string | number | string[];
}

// Запись в справочнике
interface ReferenceEntry {
  id: string;
  referenceDefinitionId: string;
  displayValue: string;
  fields: ReferenceFieldValue[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Детальная информация о записи
interface ReferenceEntryDetail extends ReferenceEntry {
  linkedEntries: { [referenceDefinitionId: string]: ReferenceEntry[] };
  usedIn: ReferenceUsage[];
}
```

### Расширенное определение поля

```typescript
interface ReferenceFieldDef {
  id: string;
  name: string;
  type: FieldType;
  required: boolean;
  // Новые поля для поддержки связей:
  targetReferenceId?: string;      // ID справочника, на который ссылается
  targetReferenceName?: string;    // Название справочника
  cascadeFilter?: boolean;          // Автофильтрация связанных записей
}
```

## Компоненты

### 1. ReferenceEntriesContext
Контекст для управления записями справочников

### 2. ReferenceEntryDetailDialog
Диалог детального просмотра записи с навигацией

### 3. ReferenceFieldSelect
Умный селектор с автофильтрацией и навигацией

### 4. AddCustomFieldModal (обновлен)
Теперь поддерживает выбор целевого справочника для полей типа "reference"

## Пример CRM-структуры

```
Справочник: Компания
├── Поля:
│   ├── Название (text) *обязательное*
│   └── ИНН (number)

Справочник: Клиент
├── Поля:
│   ├── Имя (text) *обязательное*
│   ├── Телефон (phone)
│   ├── Email (email)
│   └── Компания (reference → Компания) *каскадная фильтрация*

Сделка (карточка)
├── Поля:
│   ├── Компания (reference → Компания)
│   └── Клиент (reference → Клиент) *автофильтруется по Компании*
```

## Преимущества

✅ **Как в AmoCRM**: Привычная логика работы со справочниками
✅ **Автофильтрация**: Не нужно вручную искать связанные записи
✅ **Навигация**: Переходы между связанными записями одним кликом
✅ **Детальный просмотр**: Вся информация о связях в одном месте
✅ **Типобезопасность**: Полная поддержка TypeScript
✅ **Гибкость**: Любые справочники могут ссылаться друг на друга

## Следующие шаги

Для полной интеграции с вашей CRM системой:

1. Добавить создание записей прямо из модального окна ReferenceEntryDetailDialog
2. Интегрировать ReferenceFieldSelect в DealModal для сделок
3. Добавить импорт/экспорт записей справочников
4. Реализовать права доступа к справочникам
5. Добавить историю изменений записей
