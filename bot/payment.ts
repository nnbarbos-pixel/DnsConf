import { Telegraf } from 'telegraf';

const XROCKET_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6IjMwMjcwMiIsImp0aSI6ImFwcDozMDI3MDI6ZmNmNTM1ODktMWQ0Yi00YjY0LWEzODItNTFmNWMzY2U1Y2NmIiwiaWF0IjoxNzkwMzI5NzMyfQ.n9OajGgPdsdYMsSWow3jC5Ut2jItQg7FQFgs7QUMmoc';
const CRYPTOBOT_TOKEN = '638572:AAe4eRuprcqK7wGSuR6Sp84rlX1NYclRGzG';

const cryptoBot = new Telegraf(CRYPTOBOT_TOKEN);

interface InvoiceParams {
  userId: number;
  amount: number;
  currency: string;
  description: string;
}

export async function createXRocketInvoice(params: InvoiceParams): Promise<string> {
  const response = await fetch('https://pay.xrocket.tg/api/v1/invoices', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${XROCKET_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency,
      description: params.description,
      external_id: `user_${params.userId}_${Date.now()}`,
      success_url: 'https://t.me/YOUR_BOT_USERNAME',
    }),
  });

  if (!response.ok) {
    throw new Error(`XRocket API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data.pay_url;
}

export async function createCryptoBotInvoice(params: InvoiceParams): Promise<string> {
  try {
    const invoice = await cryptoBot.telegram.createInvoiceLink(
      params.description,
      JSON.stringify({ userId: params.userId, timestamp: Date.now() }),
      'XTR', // Telegram Stars
      [{ label: 'Пополнение баланса', amount: Math.round(params.amount * 100) }]
    );

    return invoice;
  } catch (error) {
    console.error('CryptoBot invoice error:', error);
    throw error;
  }
}

export async function verifyXRocketPayment(invoiceId: string): Promise<boolean> {
  const response = await fetch(`https://pay.xrocket.tg/api/v1/invoices/${invoiceId}`, {
    headers: {
      'Authorization': `Bearer ${XROCKET_TOKEN}`,
    },
  });

  if (!response.ok) {
    return false;
  }

  const data = await response.json();
  return data.data.status === 'paid';
}

export const SUBSCRIPTION_PLANS = {
  basic: {
    name: '⭐️ Basic',
    price: 5,
    limits: {
      requests: 100,
      validity: 30, // дней
    },
    features: [
      '100 запросов',
      'Все текстовые модели',
      'Базовая генерация картинок',
      'Действует 30 дней',
    ],
  },
  pro: {
    name: '💎 Pro',
    price: 15,
    limits: {
      requests: 500,
      validity: 30,
    },
    features: [
      '500 запросов',
      'Все модели без ограничений',
      'Premium генерация картинок',
      'Приоритетная обработка',
      'Действует 30 дней',
    ],
  },
  unlimited: {
    name: '🚀 Unlimited',
    price: 50,
    limits: {
      requests: -1, // безлимит
      validity: 30,
    },
    features: [
      '♾ Безлимитные запросы',
      'Все модели',
      'Максимальное качество картинок',
      'Наивысший приоритет',
      'Техподдержка 24/7',
      'Действует 30 дней',
    ],
  },
};

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;
