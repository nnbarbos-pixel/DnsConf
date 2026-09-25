import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Определяем тип модели для выбора правильного API
function getModelType(model: string): 'anthropic' | 'openai' {
  if (model.startsWith('claude-')) return 'anthropic';
  return 'openai'; // GPT, Gemini, Grok, DeepSeek, GLM все используют OpenAI-совместимый формат
}

export async function POST(req: NextRequest) {
  try {
    const { messages, model, temperature, maxTokens, systemPrompt } = await req.json();

    const selectedModel = model || process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
    const modelType = getModelType(selectedModel);

    console.log('=== INCOMING REQUEST ===');
    console.log('Model:', selectedModel);
    console.log('Model type:', modelType);

    if (!process.env.ANTHROPIC_AUTH_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'API ключ не настроен. Проверьте переменную окружения ANTHROPIC_AUTH_TOKEN.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Сообщения не переданы или неверного формата.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const baseURL = process.env.ANTHROPIC_BASE_URL || 'https://vibecode.moe';
    const apiKey = process.env.ANTHROPIC_AUTH_TOKEN;

    if (modelType === 'anthropic') {
      // Используем Anthropic SDK для Claude моделей
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const anthropic = new Anthropic({
        apiKey,
        baseURL,
      });

      const stream = await anthropic.messages.stream({
        model: selectedModel,
        max_tokens: maxTokens || 4096,
        temperature: temperature !== undefined ? temperature : 1.0,
        system: systemPrompt || undefined,
        messages: messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        })),
      });

      const encoder = new TextEncoder();

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const event of stream) {
              if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                const text = event.delta.text;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            console.error('Streaming error:', error);
            controller.error(error);
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Используем OpenAI-совместимый формат для GPT, Gemini, Grok, DeepSeek и т.д.
      const requestBody: any = {
        model: selectedModel,
        messages: messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: temperature !== undefined ? temperature : 1.0,
        max_tokens: maxTokens || 4096,
        stream: true,
      };

      // Добавляем system prompt для OpenAI-формата
      if (systemPrompt) {
        requestBody.messages.unshift({
          role: 'system',
          content: systemPrompt,
        });
      }

      const response = await fetch(`${baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} ${errorText}`);
      }

      // Преобразуем OpenAI SSE формат в наш формат
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            const reader = response.body?.getReader();
            if (!reader) throw new Error('No response body');

            let buffer = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') continue;

                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`));
                    }
                  } catch (e) {
                    // Пропускаем невалидный JSON
                  }
                }
              }
            }

            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            console.error('Streaming error:', error);
            controller.error(error);
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Произошла ошибка при обработке запроса.',
        details: error.toString()
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
