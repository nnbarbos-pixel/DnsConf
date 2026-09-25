import { Telegraf } from 'telegraf';
import { BOT_TOKEN, API_BASE_URL, API_TOKEN } from './config';
import { db } from './database';
import { calculateCost, MODEL_PRICING, getModelDisplayPrice } from './pricing';
import { createXRocketInvoice, createCryptoBotInvoice, SUBSCRIPTION_PLANS, SubscriptionPlan } from './payment';

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

// Главное меню
function getMainMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🤖 Выбрать модель', callback_data: 'menu:models' },
        { text: '💰 Баланс', callback_data: 'menu:balance' }
      ],
      [
        { text: '💎 Подписки', callback_data: 'menu:subscriptions' },
        { text: '👥 Рефералка', callback_data: 'menu:referral' }
      ],
      [
        { text: '📊 Статистика', callback_data: 'menu:stats' },
        { text: '❓ Помощь', callback_data: 'menu:help' }
      ]
    ]
  };
}

bot.start((ctx) => {
  const userId = ctx.from.id;
  userSettings.set(userId, { model: 'claude-sonnet-5' });

  // Проверка реферального кода
  const args = ctx.message.text.split(' ');
  if (args.length > 1) {
    const refCode = args[1];
    if (db.setReferrer(userId, refCode)) {
      ctx.reply('✅ Реферальный код применен! Вы получите бонусы после первого пополнения.');
    }
  }

  const user = db.getUser(userId);

  ctx.reply(
    '👋 *Добро пожаловать!*\n\n' +
    'Я AI-бот для генерации текста и изображений.\n\n' +
    '💬 *Текстовые модели:*\n' +
    '• Claude Sonnet 5, Opus 5, Fable 5.1\n' +
    '• GPT-6 Astra, GPT-6 Sol\n\n' +
    '🎨 *Генерация изображений:*\n' +
    '• Nano Banana Pro/2\n' +
    '• GPT Image 2\n\n' +
    `💰 Ваш баланс: $${user.balance.toFixed(4)}\n` +
    `🎁 Бесплатных запросов: ${user.freeRequests}\n\n` +
    '📝 Просто отправь мне текст — я отвечу!',
    { parse_mode: 'Markdown', reply_markup: getMainMenuKeyboard() }
  );
});

// Команда /admin для админки
bot.command('admin', async (ctx) => {
  const userId = ctx.from.id;

  if (!db.isAdmin(userId)) {
    await ctx.reply('❌ У вас нет доступа к админ-панели');
    return;
  }

  const keyboard = {
    inline_keyboard: [
      [
        { text: '📊 Статистика', callback_data: 'admin:stats' },
        { text: '👥 Пользователи', callback_data: 'admin:users' }
      ],
      [
        { text: '📝 Все запросы', callback_data: 'admin:requests' },
        { text: '💰 Платежи', callback_data: 'admin:payments' }
      ],
      [
        { text: '⚙️ Управление', callback_data: 'admin:manage' }
      ]
    ]
  };

  await ctx.reply(
    '🔧 *Админ-панель*\n\n' +
    'Выберите действие:',
    { parse_mode: 'Markdown', reply_markup: keyboard }
  );
});

// Команда /setadmin для назначения админа (только для владельца)
bot.command('setadmin', (ctx) => {
  const OWNER_ID = ctx.from.id; // Первый кто вызовет эту команду

  if (ctx.from.id !== OWNER_ID) {
    return;
  }

  const args = ctx.message.text.split(' ');
  if (args.length < 2) {
    ctx.reply('Использование: /setadmin <user_id>');
    return;
  }

  const targetUserId = parseInt(args[1]);
  db.setAdmin(targetUserId, true);
  ctx.reply(`✅ Пользователь ${targetUserId} назначен админом`);
});

bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;
  const userId = ctx.from.id;

  // Админ-панель
  if (data?.startsWith('admin:')) {
    if (!db.isAdmin(userId)) {
      await ctx.answerCbQuery('❌ Нет доступа');
      return;
    }

    if (data === 'admin:stats') {
      const allUsers = db.getAllUsers();
      const allRequests = db.getAllRequests();
      const totalRevenue = allRequests.reduce((sum, r) => sum + r.cost, 0);

      await ctx.answerCbQuery();
      await ctx.editMessageText(
        '📊 *Статистика бота*\n\n' +
        `👥 Всего пользователей: ${allUsers.length}\n` +
        `📝 Всего запросов: ${allRequests.length}\n` +
        `💰 Общий доход: $${totalRevenue.toFixed(4)}\n` +
        `📅 Запросов сегодня: ${allRequests.filter(r => Date.now() - r.timestamp < 24 * 60 * 60 * 1000).length}`,
        { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '◀️ Назад', callback_data: 'admin:back' }]] } }
      );
    } else if (data === 'admin:requests') {
      const requests = db.getAllRequests().slice(-20).reverse();

      let text = '📝 *Последние 20 запросов*\n\n';
      requests.forEach(r => {
        const date = new Date(r.timestamp).toLocaleString('ru-RU');
        text += `👤 ID ${r.userId}\n`;
        text += `🤖 ${r.model}\n`;
        text += `💬 ${r.prompt.substring(0, 50)}...\n`;
        text += `💰 $${r.cost.toFixed(4)}\n`;
        text += `⏰ ${date}\n\n`;
      });

      await ctx.answerCbQuery();
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '◀️ Назад', callback_data: 'admin:back' }]] }
      });
    } else if (data === 'admin:back') {
      const keyboard = {
        inline_keyboard: [
          [
            { text: '📊 Статистика', callback_data: 'admin:stats' },
            { text: '👥 Пользователи', callback_data: 'admin:users' }
          ],
          [
            { text: '📝 Все запросы', callback_data: 'admin:requests' },
            { text: '💰 Платежи', callback_data: 'admin:payments' }
          ]
        ]
      };

      await ctx.answerCbQuery();
      await ctx.editMessageText(
        '🔧 *Админ-панель*\n\n' +
        'Выберите действие:',
        { parse_mode: 'Markdown', reply_markup: keyboard }
      );
    }
    return;
  }

  // Меню баланса
  if (data === 'menu:balance') {
    const user = db.getUser(userId);

    const keyboard = {
      inline_keyboard: [
        [
          { text: '💳 Пополнить (XRocket)', callback_data: 'pay:xrocket' },
          { text: '💎 Пополнить (CryptoBot)', callback_data: 'pay:crypto' }
        ],
        [{ text: '🏠 Главное меню', callback_data: 'menu:main' }]
      ]
    };

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '💰 *Ваш баланс*\n\n' +
      `💵 Баланс: $${user.balance.toFixed(4)}\n` +
      `🎁 Бесплатных запросов: ${user.freeRequests}\n` +
      `📊 Всего запросов: ${user.totalRequests}\n\n` +
      'Выберите способ пополнения:',
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  }

  // Меню подписок
  else if (data === 'menu:subscriptions') {
    const user = db.getUser(userId);
    let subText = '';

    if (user.subscription && db.checkSubscription(userId)) {
      const plan = SUBSCRIPTION_PLANS[user.subscription.plan];
      const daysLeft = Math.ceil((user.subscription.expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
      const requestsText = user.subscription.requestsLeft === -1 ? '♾ Безлимит' : `${user.subscription.requestsLeft} запросов`;

      subText = `✅ *Активная подписка*\n\n` +
        `📦 ${plan.name}\n` +
        `📊 Осталось: ${requestsText}\n` +
        `⏰ Действует: ${daysLeft} дней\n\n`;
    } else {
      subText = '❌ *Нет активной подписки*\n\n';
    }

    const keyboard = {
      inline_keyboard: [
        [{ text: '⭐️ Basic ($5)', callback_data: 'sub:basic' }],
        [{ text: '💎 Pro ($15)', callback_data: 'sub:pro' }],
        [{ text: '🚀 Unlimited ($50)', callback_data: 'sub:unlimited' }],
        [{ text: '🏠 Главное меню', callback_data: 'menu:main' }]
      ]
    };

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      subText +
      '💎 *Доступные подписки*\n\n' +
      '⭐️ **Basic** - $5\n' +
      SUBSCRIPTION_PLANS.basic.features.map(f => `• ${f}`).join('\n') + '\n\n' +
      '💎 **Pro** - $15\n' +
      SUBSCRIPTION_PLANS.pro.features.map(f => `• ${f}`).join('\n') + '\n\n' +
      '🚀 **Unlimited** - $50\n' +
      SUBSCRIPTION_PLANS.unlimited.features.map(f => `• ${f}`).join('\n'),
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  }

  // Покупка подписки
  else if (data?.startsWith('sub:')) {
    const plan = data.replace('sub:', '') as SubscriptionPlan;
    const planData = SUBSCRIPTION_PLANS[plan];

    const keyboard = {
      inline_keyboard: [
        [
          { text: '💳 XRocket', callback_data: `buysub:${plan}:xrocket` },
          { text: '💎 CryptoBot', callback_data: `buysub:${plan}:crypto` }
        ],
        [{ text: '◀️ Назад', callback_data: 'menu:subscriptions' }]
      ]
    };

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      `💎 *${planData.name}*\n\n` +
      `💰 Цена: $${planData.price}\n\n` +
      '*Возможности:*\n' +
      planData.features.map(f => `• ${f}`).join('\n') + '\n\n' +
      'Выберите способ оплаты:',
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  }

  // Обработка покупки подписки
  else if (data?.startsWith('buysub:')) {
    const [, plan, method] = data.split(':');
    const planData = SUBSCRIPTION_PLANS[plan as SubscriptionPlan];

    try {
      let paymentUrl: string;

      if (method === 'xrocket') {
        paymentUrl = await createXRocketInvoice({
          userId,
          amount: planData.price,
          currency: 'USD',
          description: `Подписка ${planData.name}`,
        });
      } else {
        paymentUrl = await createCryptoBotInvoice({
          userId,
          amount: planData.price,
          currency: 'USDT',
          description: `Подписка ${planData.name}`,
        });
      }

      await ctx.answerCbQuery();
      await ctx.editMessageText(
        `💳 *Оплата подписки ${planData.name}*\n\n` +
        `💰 Сумма: $${planData.price}\n\n` +
        `[➡️ Перейти к оплате](${paymentUrl})\n\n` +
        `После оплаты подписка активируется автоматически!`,
        { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '🏠 Главное меню', callback_data: 'menu:main' }]] } }
      );
    } catch (error) {
      console.error('Payment error:', error);
      await ctx.answerCbQuery('❌ Ошибка создания счета');
    }
  }

  // Меню рефералки
  else if (data === 'menu:referral') {
    const user = db.getUser(userId);
    const referrals = db.getAllUsers().filter(u => u.referredBy === user.referralCode);

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '👥 *Реферальная программа*\n\n' +
      `🎁 За каждого приглашенного: *1 бесплатный запрос*\n\n` +
      `📎 Ваша ссылка:\n` +
      `\`https://t.me/${ctx.me}?start=${user.referralCode}\`\n\n` +
      `👥 Приглашено: ${referrals.length} человек\n` +
      `🎁 Получено запросов: ${referrals.length}`,
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '🏠 Главное меню', callback_data: 'menu:main' }]] } }
    );
  }

  // Остальные меню
  else if (data === 'menu:main') {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '🏠 *Главное меню*\n\n' +
      'Выбери действие:',
      { parse_mode: 'Markdown', reply_markup: getMainMenuKeyboard() }
    );
  }

  else if (data?.startsWith('model:')) {
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
        `Выбрана: *${model.name}*\n` +
        `💰 Цена: ${getModelDisplayPrice(modelId)}\n\n` +
        `Теперь отправь мне сообщение!`,
        { parse_mode: 'Markdown', reply_markup: keyboard }
      );
    }
  }

  else if (data === 'menu:models') {
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
  }

  else if (data === 'menu:text_models') {
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
  }

  else if (data === 'menu:image_models') {
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
  }

  else if (data === 'menu:stats') {
    const user = db.getUser(userId);
    const userRequests = db.getUserRequests(userId);
    const totalCost = userRequests.reduce((sum, r) => sum + r.cost, 0);

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '📊 *Твоя статистика*\n\n' +
      `💵 Баланс: $${user.balance.toFixed(4)}\n` +
      `🎁 Бесплатных: ${user.freeRequests}\n` +
      `📝 Всего запросов: ${user.totalRequests}\n` +
      `💰 Потрачено: $${totalCost.toFixed(4)}\n` +
      `ID: \`${userId}\``,
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '🏠 Главное меню', callback_data: 'menu:main' }]] } }
    );
  }

  else if (data === 'menu:help') {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '📚 *Как пользоваться ботом*\n\n' +
      '1️⃣ Пополни баланс или купи подписку\n' +
      '2️⃣ Выбери модель\n' +
      '3️⃣ Отправь запрос\n\n' +
      '💡 *Советы:*\n' +
      '• Используй подписку для экономии\n' +
      '• Приглашай друзей — получай бонусы\n' +
      '• Разные модели = разные цены',
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '🏠 Главное меню', callback_data: 'menu:main' }]] } }
    );
  }
});

bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const userModel = userSettings.get(userId)?.model || 'claude-sonnet-5';
  const message = ctx.message.text;

  console.log(`📨 Message from ${userId}: "${message}"`);
  console.log(`🤖 Using model: ${userModel}`);

  const user = db.getUser(userId);

  // Проверка баланса/подписки - для подписки не проверяем баланс
  const hasSubscription = db.checkSubscription(userId);
  const hasFreeRequests = user.freeRequests > 0;

  if (!hasSubscription && !hasFreeRequests && user.balance <= 0) {
    await ctx.reply(
      '❌ *Недостаточно средств*\n\n' +
      'Пополни баланс или купи подписку!',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💰 Пополнить', callback_data: 'menu:balance' }],
            [{ text: '💎 Подписки', callback_data: 'menu:subscriptions' }]
          ]
        }
      }
    );
    return;
  }

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
        // Списание за картинку ПОСЛЕ успешной генерации
        const cost = calculateCost(userModel, 0, 0);

        if (hasSubscription) {
          db.useSubscriptionRequest(userId);
        } else if (hasFreeRequests) {
          user.freeRequests--;
        } else {
          if (!db.deductCost(userId, cost)) {
            await ctx.deleteMessage(statusMessage.message_id);
            await ctx.reply('❌ Недостаточно средств');
            return;
          }
        }

        db.logRequest({ userId, model: userModel, prompt: message, cost, timestamp: Date.now() });

        await ctx.deleteMessage(statusMessage.message_id);
        await ctx.replyWithPhoto(imageUrl, {
          caption: `🎨 ${message}\n\n💰 Стоимость: $${cost.toFixed(4)}`
        });
      } else {
        throw new Error('No image URL in response');
      }
    } else {
      // Текстовая модель
      const isClaudeModel = userModel.startsWith('claude-');

      if (isClaudeModel) {
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

        const inputTokens = result.usage?.input_tokens || 0;
        const outputTokens = result.usage?.output_tokens || 0;
        const cost = calculateCost(userModel, inputTokens, outputTokens);

        // Списание
        if (hasSubscription) {
          db.useSubscriptionRequest(userId);
        } else if (hasFreeRequests) {
          user.freeRequests--;
        } else if (!db.deductCost(userId, cost)) {
          await ctx.deleteMessage(statusMessage.message_id);
          await ctx.reply('❌ Недостаточно средств');
          return;
        }

        db.logRequest({ userId, model: userModel, prompt: message, tokens: inputTokens + outputTokens, cost, timestamp: Date.now() });

        let reply = 'Нет ответа';

        if (result.content && result.content.length > 0) {
          const textContent = result.content.find((c: any) => c.type === 'text');
          if (textContent?.text) {
            reply = textContent.text;
          }
        }

        await ctx.deleteMessage(statusMessage.message_id);

        const MAX_LENGTH = 4000;
        if (reply.length <= MAX_LENGTH) {
          await ctx.reply(
            `${reply}\n\n💰 ${cost.toFixed(6)}$ | 📊 ${inputTokens + outputTokens} токенов`,
            { reply_to_message_id: ctx.message.message_id }
          );
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
            if (i < parts.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        }
      } else {
        // GPT модель
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

        const inputTokens = result.usage?.prompt_tokens || 0;
        const outputTokens = result.usage?.completion_tokens || 0;
        const cost = calculateCost(userModel, inputTokens, outputTokens);

        // Списание
        if (hasSubscription) {
          db.useSubscriptionRequest(userId);
        } else if (hasFreeRequests) {
          user.freeRequests--;
        } else if (!db.deductCost(userId, cost)) {
          await ctx.deleteMessage(statusMessage.message_id);
          await ctx.reply('❌ Недостаточно средств');
          return;
        }

        db.logRequest({ userId, model: userModel, prompt: message, tokens: inputTokens + outputTokens, cost, timestamp: Date.now() });

        const reply = result.choices?.[0]?.message?.content || 'Нет ответа';

        await ctx.deleteMessage(statusMessage.message_id);

        const MAX_LENGTH = 4000;
        if (reply.length <= MAX_LENGTH) {
          await ctx.reply(
            `${reply}\n\n💰 ${cost.toFixed(6)}$ | 📊 ${inputTokens + outputTokens} токенов`,
            { reply_to_message_id: ctx.message.message_id }
          );
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
