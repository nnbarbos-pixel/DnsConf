export const MODEL_PRICING = {
  // Claude models (вход × 2.3)
  'claude-fable-5-1': { input: 1.97 * 2.3, output: 9.84 * 2.3, type: 'text' as const },
  'claude-fable-5': { input: 4.71 * 2.3, output: 23.53 * 2.3, type: 'text' as const },
  'claude-haiku-4-5': { input: 0.20 * 2.3, output: 0.98 * 2.3, type: 'text' as const },
  'claude-sonnet-4-6': { input: 0.30 * 2.3, output: 1.48 * 2.3, type: 'text' as const },
  'claude-sonnet-5': { input: 0.20 * 2.3, output: 0.98 * 2.3, type: 'text' as const },
  'claude-opus-4-6': { input: 0.49 * 2.3, output: 2.46 * 2.3, type: 'text' as const },
  'claude-opus-4-7': { input: 0.49 * 2.3, output: 2.46 * 2.3, type: 'text' as const },
  'claude-opus-4-8': { input: 0.49 * 2.3, output: 2.46 * 2.3, type: 'text' as const },
  'claude-opus-5': { input: 0.49 * 2.3, output: 2.46 * 2.3, type: 'text' as const },

  // GPT models (вход × 2.3)
  'gpt-6-astra': { input: 0.85 * 2.3, output: 4.26 * 2.3, type: 'text' as const },
  'gpt-5.6-sol': { input: 0.43 * 2.3, output: 2.56 * 2.3, type: 'text' as const },
  'gpt-5.6-terra': { input: 0.17 * 2.3, output: 1.02 * 2.3, type: 'text' as const },
  'gpt-6-sol': { input: 0.17 * 2.3, output: 0.85 * 2.3, type: 'text' as const },
  'gpt-6-luna': { input: 0.013 * 2.3, output: 0.066 * 2.3, type: 'text' as const },
  'gpt-5.6-luna': { input: 0.026 * 2.3, output: 0.16 * 2.3, type: 'text' as const },
  'gpt-5.5': { input: 0.43 * 2.3, output: 2.56 * 2.3, type: 'text' as const },
  'gpt-5.4-mini': { input: 0.098 * 2.3, output: 0.59 * 2.3, type: 'text' as const },

  // Image models (за фото × 2.3)
  'gpt-image-2': { perImage: 0.013 * 2.3, type: 'image' as const },
  'gpt-image-2.5': { perImage: 0.020 * 2.3, type: 'image' as const },
  'gpt-image-2-vip': { perImage: 0.043 * 2.3, type: 'image' as const },
  'nano-banana-2': { perImage: 0.039 * 2.3, type: 'image' as const },
  'nano-banana-pro': { perImage: 0.059 * 2.3, type: 'image' as const },
  'nano-banana-2-lite': { perImage: 0.016 * 2.3, type: 'image' as const },
};

export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING];

  if (!pricing) {
    return 0;
  }

  if (pricing.type === 'image') {
    return pricing.perImage;
  }

  // Текстовые модели: (input tokens / 1M) * input price + (output tokens / 1M) * output price
  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(4)}`;
}

export function getModelDisplayPrice(model: string): string {
  const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING];

  if (!pricing) {
    return 'Неизвестная модель';
  }

  if (pricing.type === 'image') {
    return `${formatPrice(pricing.perImage)} за фото`;
  }

  return `${formatPrice(pricing.input)} вход / ${formatPrice(pricing.output)} выход (за 1M токенов)`;
}
