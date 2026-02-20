# Руководство по модальным окнам для контактов и компаний

## Обзор

В CRM добавлены модальные окна для просмотра и редактирования записей справочников (контактов и компаний). Модальные окна открываются при клике на запись в таблице на странице "Данные CRM".

## Компоненты

### ReferenceRecordModal

Универсальный компонент для отображения детальной информации о записи справочника с возможностью редактирования.

**Расположение:** `/src/components/ReferenceRecordModal.tsx`

#### Функциональность

1. **Вкладка "Информация"**
   - Отображает все поля записи
   - Поля типа reference отображаются как кликабельные чипы
   - Показывает метаданные: дату создания, автора, дату обновления

2. **Вкладка "Связанные записи"** (Контакты для компаний / Компания для контактов)
   - Отображает записи из связанных справочников
   - Клик по записи открывает её детали в том же модальном окне
   - Показывает количество связанных записей в заголовке вкладки

3. **Вкладка "Сделки"**
   - Отображает список сделок, связанных с записью
   - Показывает название, номер, сумму и статус сделки
   - Визуальная индикация через аватары и цветовые метки

4. **Вкладка "Редактирование"**
   - Форма для редактирования всех полей записи
   - Поддержка всех типов полей (text, numeric, reference, multiselect и т.д.)
   - Кнопки "Сохранить" и "Отмена"
   - Валидация обязательных полей

#### Пример использования

```tsx
import ReferenceRecordModal from './components/ReferenceRecordModal';

function MyComponent() {
  const [entryId, setEntryId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button onClick={() => {
        setEntryId('entry-id-123');
        setModalOpen(true);
      }}>
        Открыть запись
      </Button>

      <ReferenceRecordModal
        open={modalOpen}
        entryId={entryId}
        onClose={() => {
          setModalOpen(false);
          setEntryId(null);
        }}
        onNavigateToEntry={(newEntryId) => setEntryId(newEntryId)}
        deals={relatedDeals}
      />
    </>
  );
}
```

## Контексты

### DealsContext

Контекст для управления сделками и получения связанных данных.

**Расположение:** `/src/context/DealsContext.tsx`

#### API

```tsx
interface DealsContextType {
  deals: Deal[];                              // Все сделки
  getDealsForEntry: (entryId: string) => Deal[]; // Получить сделки для записи
  updateDeals: (deals: Deal[]) => void;       // Обновить список сделок
}
```

#### Использование

```tsx
import { useDealsContext } from '../context/DealsContext';

function MyComponent() {
  const { getDealsForEntry } = useDealsContext();

  const relatedDeals = getDealsForEntry('entry-id-123');

  return <div>Найдено {relatedDeals.length} сделок</div>;
}
```

## Интеграция с FieldsWorkspacePage

Страница "Данные CRM" интегрирована с модальными окнами:

1. Клик по любой строке в таблице открывает модальное окно
2. Автоматически загружаются связанные сделки
3. Навигация между записями внутри модального окна

**Расположение:** `/src/components/FieldsWorkspacePage.tsx`

### Обработчики событий

```tsx
// Открытие модального окна при клике на запись
const handleEntryClick = (entryId: string) => {
  setSelectedEntryId(entryId);
  setModalOpen(true);
};

// Навигация между записями
const handleNavigateToEntry = (entryId: string) => {
  setSelectedEntryId(entryId);
};
```

## Структура данных

### ReferenceEntry

```typescript
interface ReferenceEntry {
  id: string;                          // Уникальный ID записи
  referenceDefinitionId: string;       // ID справочника
  displayValue: string;                // Отображаемое значение
  fields: ReferenceFieldValue[];       // Значения всех полей
  createdAt: string;                   // Дата создания
  updatedAt: string;                   // Дата обновления
  createdBy: string;                   // Автор
}
```

### ReferenceEntryDetail

```typescript
interface ReferenceEntryDetail extends ReferenceEntry {
  linkedEntries: {                     // Связанные записи
    [referenceDefinitionId: string]: ReferenceEntry[];
  };
  usedIn: ReferenceUsage[];           // Где используется запись
}
```

## Хранение данных

### LocalStorage

Все данные хранятся в localStorage:

- `crm_reference_entries` - записи справочников
- `crm_deals_data` - список сделок
- `crm_deal_values_{dealId}` - значения полей для каждой сделки
- `crm_deal_fields_{dealId}` - список полей для каждой сделки

## Навигация

Модальное окно поддерживает навигацию между связанными записями:

1. Клик по чипу reference поля на вкладке "Информация"
2. Клик по записи на вкладке "Связанные записи"
3. История навигации не сохраняется (можно добавить позже)

## Редактирование

### Процесс редактирования

1. Нажать кнопку "Изменить" в заголовке модального окна
2. Автоматический переход на вкладку "Редактирование"
3. Изменить значения полей
4. Нажать "Сохранить" или "Отмена"

### Валидация

- Обязательные поля помечены звездочкой (*)
- Тип данных проверяется для numeric полей
- Reference поля поддерживают создание новых записей

## Расширение функциональности

### Добавление новых типов полей

Для добавления поддержки новых типов полей в форме редактирования:

1. Добавьте обработку в `renderEditTab()` в `ReferenceRecordModal.tsx`
2. Создайте соответствующий компонент ввода
3. Обновите валидацию в `handleSaveEdit()`

### Добавление действий

Для добавления новых действий (например, удаление записи):

1. Добавьте кнопку в DialogTitle
2. Создайте обработчик действия
3. Обновите ReferenceEntriesContext при необходимости

## Стилизация

Все компоненты используют Material-UI и theme из `/src/theme/theme.ts`.

Основные цвета:
- Primary: `#7C3AED` (фиолетовый)
- Secondary: `#6D28D9` (темно-фиолетовый)
- Success: зеленый для статуса "Выиграно"

## Производительность

### Оптимизации

1. `useMemo` для вычисляемых значений
2. `useCallback` для стабильных функций
3. Lazy loading связанных данных
4. Виртуализация для больших списков (можно добавить)

### Рекомендации

- Избегайте открытия нескольких модальных окон одновременно
- Используйте индексы для быстрого поиска в больших списках
- Кэшируйте результаты getDealsForEntry при необходимости

## Тестирование

### Ручное тестирование

1. Создайте справочник "Компании" с полями
2. Создайте справочник "Контакты" с reference полем на "Компании"
3. Создайте несколько записей
4. Откройте "Данные CRM" и выберите справочники
5. Кликните на запись для открытия модального окна
6. Проверьте все вкладки и функции редактирования

### Unit тестирование

Для добавления unit тестов используйте React Testing Library:

```tsx
import { render, screen } from '@testing-library/react';
import ReferenceRecordModal from './ReferenceRecordModal';

test('renders modal with entry data', () => {
  render(
    <ReferenceRecordModal
      open={true}
      entryId="test-entry"
      onClose={() => {}}
      deals={[]}
    />
  );

  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
```

## Известные ограничения

1. История навигации между записями не сохраняется
2. Нет массового редактирования записей
3. Нет экспорта/импорта данных из модального окна
4. Attachments не поддерживаются пока

## Будущие улучшения

- [ ] Добавить историю изменений записи
- [ ] Реализовать комментарии к записям
- [ ] Добавить теги и категории
- [ ] Поддержка файлов и изображений
- [ ] Расширенный поиск внутри модального окна
- [ ] Горячие клавиши для быстрой навигации
- [ ] Шаринг ссылок на конкретные записи
- [ ] Экспорт записи в PDF/Excel

## Поддержка

При возникновении проблем:

1. Проверьте консоль браузера на наличие ошибок
2. Убедитесь, что данные в localStorage корректны
3. Очистите localStorage и создайте новые тестовые данные
4. Проверьте, что все контексты правильно обернуты в App.tsx
