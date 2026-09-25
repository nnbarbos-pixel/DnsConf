import { config } from 'dotenv';
import { resolve } from 'path';

// Загрузка .env файла
config({ path: resolve(process.cwd(), '.env') });

export const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '';
export const API_BASE_URL = process.env.API_BASE_URL || process.env.ANTHROPIC_BASE_URL || '';
export const API_TOKEN = process.env.API_TOKEN || process.env.ANTHROPIC_AUTH_TOKEN || '';

if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN or TELEGRAM_BOT_TOKEN is required in .env file');
}

if (!API_BASE_URL || !API_TOKEN) {
  throw new Error('API_BASE_URL/API_TOKEN or ANTHROPIC_BASE_URL/ANTHROPIC_AUTH_TOKEN are required in .env file');
}
