# ANCAP Frontend Documentation

## Overview

ANCAP Frontend - современный веб-интерфейс для AI-Native Capital Allocation Platform, построенный на Next.js 15 и React 19 с использованием TypeScript.

## Технологический стек

- **Framework**: Next.js 15.5.12 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS + Custom CSS Variables
- **Language**: TypeScript
- **Authentication**: JWT-based auth with AuthProvider
- **Internationalization**: Custom LanguageProvider (EN/RU)
- **API Client**: Custom API wrapper with fetch

## Архитектура

### Структура проекта

```
frontend-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   ├── dashboard/         # User dashboard
│   │   ├── agents/            # Agents management
│   │   ├── strategies/        # Strategies management
│   │   ├── runs/              # Runs execution
│   │   ├── projects/          # Project information
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable components
│   │   ├── AuthProvider.tsx   # Authentication context
│   │   ├── LanguageProvider.tsx # i18n context
│   │   ├── Navigation.tsx     # Main navigation
│   │   ├── NetworkBackground.tsx # Animated background
│   │   └── ...
│   ├── lib/                   # Utilities and API
│   │   └── api.ts            # API client
│   └── locales/              # Translations
│       └── translations.ts
└── package.json
```

## Дизайн-система

### Цветовая палитра

```css
:root {
  --bg: #0a0a0f;              /* Основной фон */
  --bg-card: #12121a;         /* Фон карточек */
  --text: #f0f0f5;            /* Основной текст */
  --text-muted: #8888a0;      /* Приглушенный текст */
  --accent: #00d4aa;          /* Акцентный цвет (teal) */
  --accent-dim: rgba(0, 212, 170, 0.15); /* Приглушенный акцент */
  --border: #2a2a3a;          /* Границы */
}
```

### Компоненты

#### Кнопки

- **btn-primary**: Основная кнопка с акцентным цветом
- **btn-ghost**: Прозрачная кнопка с границей

#### Карточки

- **card**: Карточка с фоном, границей и hover-эффектом
- Используется для отображения агентов, стратегий, runs и другого контента

#### Формы

- Единый стиль для всех input, select, textarea
- Темный фон с границей
- Фокус на акцентном цвете

### Анимации

- **NetworkBackground**: Анимированная сеть узлов на фоне (blockchain-стиль)
- **Card hover**: Плавное изменение границы и тени при наведении
- **Button hover**: Плавное изменение цвета

## Страницы

### 1. Landing Page (/)

**Описание**: Главная страница с информацией о платформе

**Секции**:
- Hero: Заголовок, описание, CTA кнопки
- Product (01): Информация о продукте, карточки с функциями
- Vision (02): Архитектура L1/L2/L3
- CTA: Призыв к действию
- Footer: Ссылки и информация

**Навигация**: Для неавторизованных пользователей (Product, Vision, Login, Register)

### 2. Login Page (/login)

**Описание**: Страница входа в систему

**Функции**:
- Форма с email и password
- Валидация и обработка ошибок
- Ссылка на регистрацию
- Редирект на dashboard после успешного входа

### 3. Register Page (/register)

**Описание**: Страница регистрации

**Функции**:
- Форма с display name, email, password
- Валидация (минимум 8 символов для пароля)
- Обработка ошибок
- Ссылка на вход
- Редирект на dashboard после успешной регистрации

### 4. Dashboard (/dashboard)

**Описание**: Главная панель пользователя

**Функции**:
- Статистика: количество агентов, стратегий, runs
- Секция "Recent Activity" (в разработке)
- Защита: требуется авторизация

### 5. Agents Page (/agents)

**Описание**: Управление AI-агентами

**Функции**:
- Список агентов в виде карточек
- Кнопка "Register Agent"
- Модальное окно для создания агента
- Поля: display name, public key, roles
- Пустое состояние с CTA

### 6. Strategies Page (/strategies)

**Описание**: Управление стратегиями

**Функции**:
- Список стратегий в виде карточек
- Кнопка "Create Strategy"
- Модальное окно для создания стратегии
- Поля: name, description, agent, vertical
- Предупреждение если нет агентов

### 7. Runs Page (/runs)

**Описание**: Выполнение стратегий

**Функции**:
- Список runs с статусами (completed, running, failed, killed)
- Кнопка "Create Run"
- Модальное окно для создания run
- Поля: strategy, pool, dry_run checkbox
- Цветовая индикация статусов

### 8. Projects Page (/projects)

**Описание**: Информация о платформе

**Функции**:
- Описание платформы
- Технологический стек
- Список модулей с статусами
- Быстрые ссылки (GitHub, API Docs, ARDO)

## Компоненты

### AuthProvider

**Назначение**: Управление аутентификацией

**API**:
- `isAuthenticated`: boolean - статус авторизации
- `isLoading`: boolean - загрузка
- `user`: User | null - данные пользователя
- `login(email, password)`: Promise - вход
- `register(email, password, displayName)`: Promise - регистрация
- `logout()`: void - выход

### LanguageProvider

**Назначение**: Интернационализация (EN/RU)

**API**:
- `language`: 'en' | 'ru' - текущий язык
- `setLanguage(lang)`: void - смена языка
- `t(key)`: string - перевод по ключу

### Navigation

**Назначение**: Главная навигация

**Функции**:
- Адаптивная навигация в зависимости от авторизации
- Для авторизованных: Dashboard, Agents, Strategies, Runs, Logout
- Для неавторизованных: Product, Vision, Login, Register
- Переключатель языка
- Отображение имени пользователя

### NetworkBackground

**Назначение**: Анимированный фон

**Функции**:
- Canvas с анимированными узлами
- Связи между узлами (blockchain-стиль)
- Адаптивный размер
- Низкая непрозрачность (не отвлекает от контента)

## API Integration

### API Client (lib/api.ts)

**Базовый URL**: `http://localhost:8000/v1`

**Модули**:
- `auth`: login, register
- `agents`: list, create, get
- `strategies`: list, create, get, getVersions
- `runs`: list, create, get
- `pools`: list, create
- `verticals`: list

**Обработка ошибок**:
- Автоматический парсинг JSON
- Выброс ошибок с сообщениями
- Обработка HTTP статусов

## Запуск и разработка

### Установка зависимостей

```bash
cd frontend-app
npm install
```

### Запуск dev-сервера

```bash
npm run dev
```

Приложение будет доступно на `http://localhost:3001`

### Сборка для production

```bash
npm run build
npm run start
```

### Тестирование

```bash
npm run test        # Запуск тестов
npm run test:watch  # Watch mode
```

## Требования

- Node.js 18+
- Backend API должен быть запущен на `http://localhost:8000`
- PostgreSQL база данных (для backend)

## Особенности реализации

### Защита маршрутов

Все страницы кроме landing, login и register защищены:

```typescript
useEffect(() => {
  if (!authLoading && !isAuthenticated) {
    router.push("/login");
  }
}, [isAuthenticated, authLoading, router]);
```

### Модальные окна

Все формы создания (агенты, стратегии, runs) используют модальные окна:
- Фон с затемнением
- Центрирование
- Кнопки "Create" и "Cancel"
- Обработка ошибок внутри модала

### Пустые состояния

Все списки имеют пустые состояния с CTA:
- Информативное сообщение
- Кнопка для создания первого элемента
- Предупреждения о зависимостях (например, "создайте агента сначала")

### Загрузка данных

Все страницы показывают состояние загрузки:
- "Loading..." текст с центрированием
- Загрузка при монтировании компонента
- Обновление после создания/изменения

## Будущие улучшения

- [ ] Добавить пагинацию для списков
- [ ] Добавить фильтры и поиск
- [ ] Добавить детальные страницы для агентов/стратегий/runs
- [ ] Добавить графики и визуализации
- [ ] Добавить real-time обновления (WebSocket)
- [ ] Добавить темную/светлую тему
- [ ] Добавить больше языков
- [ ] Добавить unit и e2e тесты
- [ ] Оптимизировать производительность
- [ ] Добавить PWA поддержку

## Контакты и поддержка

Для вопросов и предложений:
- GitHub: https://github.com/dragoncattrx-hub/ancap
- API Docs: http://localhost:8000/docs
