import { XROCKET_TOKEN, CRYPTOBOT_TOKEN } from './config';

interface InvoiceParams {
  userId: number;
  amount: number;
  currency: string;
  description: string;
}

// XRocket API
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
      success_url: 'https://t.me/your_bot',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('XRocket API error:', error);
    throw new Error(`XRocket error: ${response.status}`);
  }

  const result = await response.json();
  return result.data.url;
}

// CryptoBot API
export async function createCryptoBotInvoice(params: InvoiceParams): Promise<string> {
  const response = await fetch('https://pay.crypt.bot/api/createInvoice', {
    method: 'POST',
    headers: {
      'Crypto-Pay-API-Token': CRYPTOBOT_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: params.amount,
      currency_type: 'fiat',
      fiat: params.currency,
      description: params.description,
      payload: `user_${params.userId}`,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('CryptoBot API error:', error);
    throw new Error(`CryptoBot error: ${response.status}`);
  }

  const result = await response.json();
  return result.result.pay_url;
}
