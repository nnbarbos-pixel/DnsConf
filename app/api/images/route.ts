import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { prompt, model, n = 1, size = '1024x1024' } = await req.json();

    console.log('=== IMAGE GENERATION REQUEST ===');
    console.log('Model:', model);
    console.log('Prompt:', prompt);
    console.log('Size:', size);

    if (!process.env.ANTHROPIC_AUTH_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'API ключ не настроен. Проверьте переменную окружения ANTHROPIC_AUTH_TOKEN.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Prompt обязателен и должен быть строкой.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Вызов Vibecode API для генерации изображений
    const response = await fetch(`${process.env.ANTHROPIC_BASE_URL}/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ANTHROPIC_AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        n,
        size,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Image generation error:', errorText);
      throw new Error(`Ошибка API: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Image generated successfully');

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Image API Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Произошла ошибка при генерации изображения.',
        details: error.toString()
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
