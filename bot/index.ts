import { Telegraf } from 'telegraf';
import { BOT_TOKEN, API_BASE_URL, API_TOKEN } from './config';

const bot = new Telegraf(BOT_TOKEN);

const AVAILABLE_MODELS = {
  text: [
    { id: 'claude-sonnet-5', name: 'Claude Sonnet 5' },
    { id: 'claude-opus-5', name: 'Claude Opus 5' },
    { id: 'claude-fable-5-1', name: 'Claude Fable 5.1' },
    { id: 'gpt-6-astra', name: 'GPT 6 Astra' },
    { id: 'gpt-6-sol', name: 'GPT 6 Sol' },
  ],
  image: [
    { id: 'nano-banana-pro', name: 'Nano Banana Pro' },
    { id: 'nano-banana-2', name: 'Nano Banana 2' },
    { id: 'gpt-image-2', name: 'GPT Image 2' },
  ],
};

const userSettings = new Map<number, { model: string }>();

bot.start((ctx) => {
  userSettings.set(ctx.from.id, { model: 'claude-sonnet-5' });

  const keyboard = {
    inline_keyboard: [
      [
        { text: '🤖 Выбрать модель', callback_data: 'menu:models' },
        { text: '❓ Помощь', callback_data: 'menu:help' }
      ],
      [
        { text: '📊 Статистика', callback_data: 'menu:stats' },
        { text: 'ℹ️ О боте', callback_data: 'menu:about' }
      ]
    ]
  };

  ctx.reply(
    '👋 *Добро пожаловать!*\n\n' +
    'Я AI-бот для генерации текста и изображений.\n\n' +
    '💬 *Текстовые модели:*\n' +
    '• Claude Sonnet 5, Opus 5, Fable 5.1\n' +
    '• GPT-6 Astra, GPT-6 Sol\n\n' +
    '🎨 *Генерация изображений:*\n' +
    '• Nano Banana Pro/2\n' +
    '• GPT Image 2\n\n' +
    '📝 Просто отправь мне текст — я отвечу!',
    { parse_mode: 'Markdown', reply_markup: keyboard }
  );
});

bot.command('help', (ctx) => {
  const keyboard = {
    inline_keyboard: [
      [{ text: '🤖 Выбрать модель', callback_data: 'menu:models' }],
      [{ text: '🏠 Главное меню', callback_data: 'menu:main' }]
    ]
  };

  ctx.reply(
    '📚 *Как пользоваться ботом*\n\n' +
    '1️⃣ Выбери модель через кнопку ниже\n' +
    '2️⃣ Отправь текстовый запрос или описание изображения\n' +
    '3️⃣ Получи ответ или изображение\n\n' +
    '💡 *Советы:*\n' +
    '• Для текста используй Claude или GPT модели\n' +
    '• Для картинок — Nano Banana или GPT Image\n' +
    '• Описывай изображения детально для лучшего результата',
    { parse_mode: 'Markdown', reply_markup: keyboard }
  );
});

bot.command('model', (ctx) => {
  const keyboard = {
    inline_keyboard: [
      [{ text: '📝 Текстовые модели', callback_data: 'menu:text_models' }],
      [{ text: '🎨 Генерация изображений', callback_data: 'menu:image_models' }],
      [{ text: '🏠 Главное меню', callback_data: 'menu:main' }]
    ],
  };

  const currentModel = userSettings.get(ctx.from.id)?.model || 'claude-sonnet-5';
  const allModels = [...AVAILABLE_MODELS.text, ...AVAILABLE_MODELS.image];
  const current = allModels.find(m => m.id === currentModel);

  ctx.reply(
    `🤖 *Выбор модели*\n\n` +
    `Текущая модель: *${current?.name || 'Claude Sonnet 5'}*\n\n` +
    `Выбери категорию:`,
    { parse_mode: 'Markdown', reply_markup: keyboard }
  );
});

bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;

  if (data?.startsWith('model:')) {
    const modelId = data.replace('model:', '');
    const allModels = [...AVAILABLE_MODELS.text, ...AVAILABLE_MODELS.image];
    const model = allModels.find((m) => m.id === modelId);

    if (model) {
      userSettings.set(ctx.from.id, { model: modelId });
      await ctx.answerCbQuery(`✅ ${model.name}`);

      const keyboard = {
        inline_keyboard: [
          [{ text: '🔄 Сменить модель', callback_data: 'menu:models' }],
          [{ text: '🏠 Главное меню', callback_data: 'menu:main' }]
        ]
      };

      await ctx.editMessageText(
        `✅ *Модель изменена*\n\n` +
        `Выбрана: *${model.name}*\n\n` +
        `Теперь отправь мне сообщение!`,
        { parse_mode: 'Markdown', reply_markup: keyboard }
      );
    }
  } else if (data === 'menu:main') {
    await ctx.answerCbQuery();

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🤖 Выбрать модель', callback_data: 'menu:models' },
          { text: '❓ Помощь', callback_data: 'menu:help' }
        ],
        [
          { text: '📊 Статистика', callback_data: 'menu:stats' },
          { text: 'ℹ️ О боте', callback_data: 'menu:about' }
        ]
      ]
    };

    await ctx.editMessageText(
      '🏠 *Главное меню*\n\n' +
      'Выбери действие:',
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  } else if (data === 'menu:models') {
    await ctx.answerCbQuery();

    const keyboard = {
      inline_keyboard: [
        [{ text: '📝 Текстовые модели', callback_data: 'menu:text_models' }],
        [{ text: '🎨 Генерация изображений', callback_data: 'menu:image_models' }],
        [{ text: '🏠 Главное меню', callback_data: 'menu:main' }]
      ]
    };

    const currentModel = userSettings.get(ctx.from.id)?.model || 'claude-sonnet-5';
    const allModels = [...AVAILABLE_MODELS.text, ...AVAILABLE_MODELS.image];
    const current = allModels.find(m => m.id === currentModel);

    await ctx.editMessageText(
      `🤖 *Выбор модели*\n\n` +
      `Текущая: *${current?.name || 'Claude Sonnet 5'}*\n\n` +
      `Выбери категорию:`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  } else if (data === 'menu:text_models') {
    await ctx.answerCbQuery();

    const keyboard = {
      inline_keyboard: [
        ...AVAILABLE_MODELS.text.map((m) => [{
          text: `📝 ${m.name}`,
          callback_data: `model:${m.id}`
        }]),
        [{ text: '◀️ Назад', callback_data: 'menu:models' }]
      ]
    };

    await ctx.editMessageText(
      '📝 *Текстовые модели*\n\n' +
      'Выбери модель для генерации текста:',
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  } else if (data === 'menu:image_models') {
    await ctx.answerCbQuery();

    const keyboard = {
      inline_keyboard: [
        ...AVAILABLE_MODELS.image.map((m) => [{
          text: `🎨 ${m.name}`,
          callback_data: `model:${m.id}`
        }]),
        [{ text: '◀️ Назад', callback_data: 'menu:models' }]
      ]
    };

    await ctx.editMessageText(
      '🎨 *Генерация изображений*\n\n' +
      'Выбери модель для создания картинок:',
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  } else if (data === 'menu:help') {
    await ctx.answerCbQuery();

    const keyboard = {
      inline_keyboard: [
        [{ text: '🤖 Выбрать модель', callback_data: 'menu:models' }],
        [{ text: '🏠 Главное меню', callback_data: 'menu:main' }]
      ]
    };

    await ctx.editMessageText(
      '📚 *Как пользоваться ботом*\n\n' +
      '1️⃣ Выбери модель через кнопку ниже\n' +
      '2️⃣ Отправь текстовый запрос или описание изображения\n' +
      '3️⃣ Получи ответ или изображение\n\n' +
      '💡 *Советы:*\n' +
      '• Для текста используй Claude или GPT модели\n' +
      '• Для картинок — Nano Banana или GPT Image\n' +
      '• Описывай изображения детально для лучшего результата',
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  } else if (data === 'menu:stats') {
    await ctx.answerCbQuery();

    const keyboard = {
      inline_keyboard: [
        [{ text: '🏠 Главное меню', callback_data: 'menu:main' }]
      ]
    };

    const currentModel = userSettings.get(ctx.from.id)?.model || 'claude-sonnet-5';
    const allModels = [...AVAILABLE_MODELS.text, ...AVAILABLE_MODELS.image];
    const current = allModels.find(m => m.id === currentModel);

    await ctx.editMessageText(
      '📊 *Твоя статистика*\n\n' +
      `Текущая модель: *${current?.name}*\n` +
      `ID пользователя: \`${ctx.from.id}\`\n\n` +
      `Статус: ✅ Активен`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  } else if (data === 'menu:about') {
    await ctx.answerCbQuery();

    const keyboard = {
      inline_keyboard: [
        [{ text: '🏠 Главное меню', callback_data: 'menu:main' }]
      ]
    };

    await ctx.editMessageText(
      'ℹ️ *О боте*\n\n' +
      '🤖 AI-бот для генерации текста и изображений\n\n' +
      '⚡️ *Возможности:*\n' +
      '• 5 текстовых моделей (Claude, GPT)\n' +
      '• 3 модели для изображений\n' +
      '• Быстрая обработка запросов\n' +
      '• Удобное меню навигации\n\n' +
      '🔧 Powered by Vibecode API',
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  }
});

bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const userModel = userSettings.get(userId)?.model || 'claude-sonnet-5';
  const message = ctx.message.text;

  console.log(`📨 Message from ${userId}: "${message}"`);
  console.log(`🤖 Using model: ${userModel}`);

  const statusMessage = await ctx.reply('⏳ Обрабатываю...');

  try {
    const isImageModel = userModel.startsWith('gpt-image-') || userModel.startsWith('nano-banana');

    if (isImageModel) {
      // Генерация изображения
      const response = await fetch(`${API_BASE_URL}/v1/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: userModel,
          prompt: message,
          n: 1,
          size: '1024x1024',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Image API error:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const imageUrl = result.data?.[0]?.url;

      if (imageUrl) {
        await ctx.deleteMessage(statusMessage.message_id);
        await ctx.replyWithPhoto(imageUrl, { caption: `🎨 ${message}` });
      } else {
        throw new Error('No image URL in response');
      }
    } else {
      // Генерация текста
      const isClaudeModel = userModel.startsWith('claude-');

      if (isClaudeModel) {
        // Anthropic формат для Claude моделей
        console.log('📤 Sending request to Claude API...');
        const response = await fetch(`${API_BASE_URL}/v1/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: userModel,
            system: 'You are a helpful AI assistant in Telegram. Answer questions directly and conversationally. Do not use any tools or file operations - just reply with text to the user.',
            messages: [{ role: 'user', content: message }],
            max_tokens: 4096,
            tools: [],
          }),
        });

        console.log('📥 Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Claude API error:', errorText);
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('Claude API response:', JSON.stringify(result, null, 2));

        // Извлекаем текст из ответа - может быть text или tool_use
        let reply = 'Нет ответа';

        if (result.content && result.content.length > 0) {
          const textContent = result.content.find((c: any) => c.type === 'text');
          const toolContent = result.content.find((c: any) => c.type === 'tool_use');

          if (textContent?.text) {
            reply = textContent.text;
          } else if (toolContent?.input?.content) {
            // Если Claude создал файл с контентом, отправим сам контент
            reply = `Создан файл ${toolContent.input.path}:\n\n${toolContent.input.content.substring(0, 2000)}`;
          } else if (toolContent) {
            reply = `Claude хочет использовать инструмент: ${toolContent.name}`;
          }
        }

        await ctx.deleteMessage(statusMessage.message_id);

        // Разбить длинные сообщения на части (лимит Telegram ~4096 символов)
        const MAX_LENGTH = 4000;
        if (reply.length <= MAX_LENGTH) {
          await ctx.reply(reply, { reply_to_message_id: ctx.message.message_id });
        } else {
          const parts = [];
          for (let i = 0; i < reply.length; i += MAX_LENGTH) {
            parts.push(reply.substring(i, i + MAX_LENGTH));
          }

          for (let i = 0; i < parts.length; i++) {
            await ctx.reply(
              `${i + 1}/${parts.length}:\n\n${parts[i]}`,
              i === 0 ? { reply_to_message_id: ctx.message.message_id } : {}
            );
            // Небольшая задержка между сообщениями
            if (i < parts.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        }
      } else {
        // OpenAI формат для GPT моделей
        const response = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: userModel,
            messages: [{ role: 'user', content: message }],
            stream: false,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('GPT API error:', errorText);
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('GPT API response:', JSON.stringify(result, null, 2));
        const reply = result.choices?.[0]?.message?.content || 'Нет ответа';

        await ctx.deleteMessage(statusMessage.message_id);

        // Разбить длинные сообщения на части (лимит Telegram ~4096 символов)
        const MAX_LENGTH = 4000;
        if (reply.length <= MAX_LENGTH) {
          await ctx.reply(reply, { reply_to_message_id: ctx.message.message_id });
        } else {
          const parts = [];
          for (let i = 0; i < reply.length; i += MAX_LENGTH) {
            parts.push(reply.substring(i, i + MAX_LENGTH));
          }

          for (let i = 0; i < parts.length; i++) {
            await ctx.reply(
              `${i + 1}/${parts.length}:\n\n${parts[i]}`,
              i === 0 ? { reply_to_message_id: ctx.message.message_id } : {}
            );
            // Небольшая задержка между сообщениями
            if (i < parts.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        }
      }
    }
  } catch (error: any) {
    console.error('Bot error:', error);
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      statusMessage.message_id,
      undefined,
      `❌ Ошибка: ${error.message}`
    );
  }
});

// Запуск бота
bot.launch().then(() => {
  console.log('🤖 Bot started successfully!');
  console.log('📱 Ready to receive messages...');
}).catch((error) => {
  console.error('❌ Failed to start bot:', error);
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
