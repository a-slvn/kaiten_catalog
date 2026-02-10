# Инструкции для Claude Code

## Распределение задач по агентам

### Frontend-разработка → `frontend-developer`
Используй этот агент для:
- React компоненты
- UI логика и интерактивность
- Стили и layouts
- Клиентская валидация
- State management
- Оптимизация производительности фронтенда

### Backend-разработка → `backend-architect`
Используй этот агент для:
- API endpoints (REST/GraphQL/gRPC)
- Серверная логика
- База данных и миграции
- Аутентификация и авторизация
- Микросервисы и архитектура
- Интеграции с внешними сервисами

### Дизайн и UX → `ui-ux-designer`
Используй этот агент для:
- Wireframes и прототипы
- Design systems
- UI/UX оптимизация
- Accessibility (a11y)
- Дизайн токены и темы
- User flows

### Тестирование UI → `/test-ui`
Кастомная команда для тестирования интерфейса через Chrome DevTools MCP:
- Визуальная проверка (скриншоты, snapshots)
- Интерактивная проверка (клики, формы, навигация)
- Проверка ошибок (консоль, сеть)
- Адаптивность (desktop, tablet, mobile)
- Accessibility (aria, фокус, контраст)
- Запуск: `/test-ui` или `/test-ui канбан` для конкретного модуля

## Инструменты для работы

### Документация → Context7 MCP
```
mcp__context7__resolve-library-id - поиск библиотеки
mcp__context7__query-docs - получение документации
```

### MUI компоненты → MUI MCP
```
mcp__mui-mcp__useMuiDocs - документация MUI
mcp__mui-mcp__fetchDocs - конкретные страницы документации
```

### Тестирование UI → Chrome DevTools MCP
```
mcp__chrome-devtools__take_snapshot - текстовый снимок страницы (a11y дерево)
mcp__chrome-devtools__take_screenshot - скриншот страницы или элемента
mcp__chrome-devtools__click - клик по элементу
mcp__chrome-devtools__fill - ввод текста в поле
mcp__chrome-devtools__navigate_page - навигация по URL
mcp__chrome-devtools__list_console_messages - ошибки в консоли
mcp__chrome-devtools__resize_page - проверка адаптивности
mcp__chrome-devtools__press_key - нажатие клавиш
```

### Figma интеграция → Figma MCP
```
mcp__figma-remote-mcp__get_design_context - получение дизайна
mcp__figma-remote-mcp__get_screenshot - скриншоты
mcp__figma-remote-mcp__generate_diagram - генерация диаграмм
```

## Правила работы

1. **Автоматически делегируй** задачи специализированным агентам
2. **Используй MUI MCP** для компонентов Material-UI
3. **Используй Context7** для актуальной документации библиотек
4. **Не создавай новые файлы** без необходимости, редактируй существующие
5. **Используй TodoWrite** для отслеживания прогресса сложных задач
