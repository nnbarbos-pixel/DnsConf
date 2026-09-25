import { config } from 'dotenv';
import { resolve } from 'path';

// Загрузка .env файла
config({ path: resolve(process.cwd(), '.env') });

export const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '';
export const API_BASE_URL = process.env.API_BASE_URL || process.env.ANTHROPIC_BASE_URL || '';
export const API_TOKEN = process.env.API_TOKEN || process.env.ANTHROPIC_AUTH_TOKEN || '';

// Payment tokens
export const XROCKET_TOKEN = process.env.XROCKET_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6IjMwMjcwMiIsImp0aSI6ImFwcDozMDI3MDI6MzIyYzk0MjEtZjE2ZS00NjdhLTljYmYtNTBkNTQzYTllY2RjIiwiaWF0IjoxNzkwMzMyODM4fQ.UUEsi6USe2fs1ng3kZXdeO9q1_7D7lRz6To5WHUCYYo';
export const CRYPTOBOT_TOKEN = process.env.CRYPTOBOT_TOKEN || '638572:AAe4eRuprcqK7wGSuR6Sp84rlX1NYclRGzG';

export const ADMIN_IDS = [8626527035];

if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN or TELEGRAM_BOT_TOKEN is required in .env file');
}

if (!API_BASE_URL || !API_TOKEN) {
  throw new Error('API_BASE_URL/API_TOKEN or ANTHROPIC_BASE_URL/ANTHROPIC_AUTH_TOKEN are required in .env file');
}
