import { config } from 'dotenv';
import { resolve } from 'path';

// Загрузка .env файла
config({ path: resolve(process.cwd(), '.env') });

export const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
export const API_BASE_URL = process.env.ANTHROPIC_BASE_URL || '';
export const API_TOKEN = process.env.ANTHROPIC_AUTH_TOKEN || '';

if (!BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required in .env file');
}

if (!API_BASE_URL || !API_TOKEN) {
  throw new Error('ANTHROPIC_BASE_URL and ANTHROPIC_AUTH_TOKEN are required in .env file');
}
