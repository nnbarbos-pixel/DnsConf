# wesk.cc Telegram Bot

Telegram бот для генерации текста и изображений через Vibecode API.

## Возможности

- 📝 Генерация текста через топовые модели:
  - Claude Sonnet 5
  - Claude Opus 5
  - Claude Fable 5.1
  - GPT 6 Astra
  - GPT 6 Sol

- 🎨 Генерация изображений:
  - Nano Banana Pro
  - Nano Banana 2
  - GPT Image 2

## Установка

1. Клонируйте репозиторий:
```bash
git clone <repo-url>
cd wesk-cc
```

2. Установите зависимости:
```bash
npm install
```

3. Настройте переменные окружения в `.env`:
```env
ANTHROPIC_BASE_URL=https://vibecode.moe
ANTHROPIC_AUTH_TOKEN=your_vibecode_token
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

4. Получите токен бота:
   - Откройте [@BotFather](https://t.me/botfather) в Telegram
   - Отправьте `/newbot`
   - Следуйте инструкциям и получите токен
   - Добавьте токен в `.env`

## Запуск

### Веб-приложение
```bash
npm run dev
```

### Telegram бот
```bash
npm run bot
```

### Telegram бот с автоперезагрузкой
```bash
npm run bot:dev
```

## Команды бота

- `/start` — Начать работу с ботом
- `/model` — Выбрать модель (текст или изображения)
- `/help` — Показать справку

## Использование

1. Запустите бота командой `/start`
2. Выберите модель через `/model`
3. Отправьте текстовый запрос:
   - Для текстовых моделей — получите ответ
   - Для моделей изображений — получите сгенерированное изображение

## Структура проекта

```
wesk-cc/
├── app/              # Next.js приложение
├── bot/              # Telegram бот
│   └── index.ts      # Основной файл бота
├── components/       # React компоненты
├── lib/              # Утилиты и store
└── .env              # Конфигурация
```

## Технологии

- Next.js 16.3 (App Router)
- React 19
- TypeScript 5
- Telegraf (Telegram Bot Framework)
- Zustand (State Management)
- Tailwind CSS 4
- Vibecode API (Proxy для Claude/GPT)
