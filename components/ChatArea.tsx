'use client';

import { useChatStore } from '@/lib/store';
import { Message } from '@/types/chat';
import { Send, Square, Loader2, Copy, RotateCcw, Edit2, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/atom-one-dark.css';

export default function ChatArea() {
  const {
    chats,
    currentChatId,
    addMessage,
    updateMessage,
    modelSettings,
    createChat,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentChat = chats.find((c) => c.id === currentChatId);

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages, streamingMessage]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  const isImageModel = (model: string) => {
    return model.startsWith('gpt-image-') || model.startsWith('nano-banana-');
  };

  const handleSend = async (messageContent?: string) => {
    const content = messageContent || input.trim();
    if (!content || isLoading) return;

    let chatId = currentChatId;
    if (!chatId) {
      chatId = createChat();
    }

    setInput('');
    setStreamingMessage('');

    const userMessage: Omit<Message, 'id' | 'timestamp'> = {
      role: 'user',
      content,
    };

    addMessage(chatId, userMessage);
    setIsLoading(true);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const chat = chats.find((c) => c.id === chatId);

      // Проверяем, используется ли модель для генерации изображений
      if (isImageModel(modelSettings.model)) {
        const response = await fetch('/api/images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: content,
            model: modelSettings.model,
            n: 1,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Ошибка при генерации изображения');
        }

        const result = await response.json();
        const imageUrl = result.data?.[0]?.url;

        if (imageUrl) {
          const assistantMessage: Omit<Message, 'id' | 'timestamp'> = {
            role: 'assistant',
            content: `![Generated Image](${imageUrl})`,
          };
          addMessage(chatId, assistantMessage);
        } else {
          throw new Error('Не удалось получить URL изображения');
        }
      } else {
        // Обычный текстовый чат
        const messages = [...(chat?.messages || []), userMessage];

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messages.map(({ role, content }) => ({ role, content })),
            model: modelSettings.model,
            temperature: modelSettings.temperature,
            maxTokens: modelSettings.maxTokens,
            systemPrompt: chat?.systemPrompt,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Ошибка при получении ответа');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.text) {
                    accumulatedText += parsed.text;
                    setStreamingMessage(accumulatedText);
                  }
                } catch (e) {
                  // Ignore parse errors
                }
              }
            }
          }
        }

        if (accumulatedText) {
          const assistantMessage: Omit<Message, 'id' | 'timestamp'> = {
            role: 'assistant',
            content: accumulatedText,
          };
          addMessage(chatId, assistantMessage);
        }
      }

      setStreamingMessage('');
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Chat error:', error);
        const errorMessage: Omit<Message, 'id' | 'timestamp'> = {
          role: 'assistant',
          content: `❌ Ошибка: ${error.message || 'Не удалось получить ответ от сервера.'}`,
        };
        if (chatId) {
          addMessage(chatId, errorMessage);
        }
      }
      setStreamingMessage('');
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
      setStreamingMessage('');
    }
  };

  const handleRetry = () => {
    if (currentChat && currentChat.messages.length > 0) {
      const lastUserMessage = [...currentChat.messages]
        .reverse()
        .find((m) => m.role === 'user');
      if (lastUserMessage) {
        handleSend(lastUserMessage.content);
      }
    }
  };

  const handleEdit = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditContent(content);
  };

  const saveEdit = () => {
    if (editingMessageId && currentChatId && editContent.trim()) {
      updateMessage(currentChatId, editingMessageId, editContent.trim());
      setEditingMessageId(null);
      setEditContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!currentChatId) {
    return <EmptyState onPromptClick={handleSend} />;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#212121]">
      {/* Messages Area - ChatGPT style */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[48rem] mx-auto">
          {currentChat?.messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              isEditing={editingMessageId === message.id}
              editContent={editContent}
              onEditContentChange={setEditContent}
              onEdit={() => handleEdit(message.id, message.content)}
              onSaveEdit={saveEdit}
              onCancelEdit={() => setEditingMessageId(null)}
              isLast={index === currentChat.messages.length - 1}
            />
          ))}

          {streamingMessage && (
            <MessageBubble
              message={{
                id: 'streaming',
                role: 'assistant',
                content: streamingMessage,
                timestamp: Date.now(),
              }}
              isLast
            />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - ChatGPT style */}
      <div className="border-t border-white/10 bg-[#212121]">
        <div className="max-w-[48rem] mx-auto px-4 pb-6 pt-4">
          <div className="relative bg-[#2f2f2f] rounded-3xl border border-white/10 focus-within:border-white/20 transition-colors shadow-lg">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isImageModel(modelSettings.model) ? "Опишите изображение, которое хотите создать..." : "Напишите сообщение..."}
              className="w-full px-5 py-4 pr-14 bg-transparent text-[#ececec] placeholder-[#8e8e8e] focus:outline-none resize-none max-h-[200px]"
              rows={1}
              disabled={isLoading}
              aria-label="Поле ввода сообщения"
            />

            {isLoading ? (
              <button
                onClick={handleStop}
                className="absolute right-3 bottom-3 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                aria-label="Остановить генерацию"
              >
                <Square className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="absolute right-3 bottom-3 p-2 bg-white disabled:bg-white/10 disabled:text-white/40 text-black rounded-lg transition-all hover:opacity-80 disabled:cursor-not-allowed"
                aria-label="Отправить сообщение"
              >
                <Send className="w-5 h-5" />
              </button>
            )}
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 mt-3 text-sm text-[#8e8e8e] justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{isImageModel(modelSettings.model) ? 'Генерация изображения...' : 'Генерация ответа...'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Message Bubble Component - ChatGPT style
function MessageBubble({
  message,
  isEditing,
  editContent,
  onEditContentChange,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  isLast,
}: {
  message: Message;
  isEditing?: boolean;
  editContent?: string;
  onEditContentChange?: (content: string) => void;
  onEdit?: () => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  isLast?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.role === 'user';

  return (
    <div className={`group ${isUser ? 'bg-[#212121]' : 'bg-[#2f2f2f]'} border-b border-white/10`}>
      <div className="max-w-[48rem] mx-auto px-4 py-6 md:py-8">
        <div className="flex gap-4 md:gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div
              className={`w-8 h-8 rounded-sm flex items-center justify-center text-sm font-semibold ${
                isUser
                  ? 'bg-[#19c37d] text-white'
                  : 'bg-[#19c37d] text-white'
              }`}
            >
              {isUser ? 'Вы' : 'AI'}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={editContent}
                  onChange={(e) => onEditContentChange?.(e.target.value)}
                  className="w-full px-4 py-3 bg-[#212121] border border-[#19c37d] rounded-lg text-[#ececec] focus:outline-none resize-none"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={onSaveEdit}
                    className="px-4 py-2 bg-[#19c37d] hover:bg-[#1a9f6a] text-white text-sm rounded-lg transition-colors font-medium"
                  >
                    <Check className="w-4 h-4 inline mr-1" />
                    Сохранить
                  </button>
                  <button
                    onClick={onCancelEdit}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-[#ececec] text-sm rounded-lg transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-[#ececec]">
                  {isUser ? (
                    <p className="whitespace-pre-wrap break-words leading-7">{message.content}</p>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex, rehypeHighlight]}
                        components={{
                          p: ({ children }) => <p className="mb-4 last:mb-0 leading-7">{children}</p>,
                          ul: ({ children }) => <ul className="mb-4 space-y-1 leading-7">{children}</ul>,
                          ol: ({ children }) => <ol className="mb-4 space-y-1 leading-7">{children}</ol>,
                          li: ({ children }) => <li className="ml-4">{children}</li>,
                          h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5 first:mt-0">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h3>,
                          img: ({ src, alt }) => (
                            <img
                              src={src}
                              alt={alt || 'Generated image'}
                              className="max-w-full h-auto rounded-lg my-4 border border-white/10"
                            />
                          ),
                          code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline ? (
                              <div className="relative group/code my-4">
                                <div className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(String(children));
                                    }}
                                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-xs text-[#ececec] transition-colors"
                                    aria-label="Копировать код"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                </div>
                                <pre className="bg-black/40 rounded-lg p-4 overflow-x-auto">
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                </pre>
                              </div>
                            ) : (
                              <code className="bg-black/40 px-1.5 py-0.5 rounded text-sm" {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Actions - ChatGPT style */}
                {!isUser && (
                  <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={handleCopy}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-[#ececec]"
                      aria-label="Копировать сообщение"
                      title="Копировать"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-[#19c37d]" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    {isLast && (
                      <button
                        onClick={() => window.location.reload()}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-[#ececec]"
                        aria-label="Повторить"
                        title="Повторить"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

                {isUser && onEdit && (
                  <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={onEdit}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-[#ececec]"
                      aria-label="Редактировать сообщение"
                      title="Редактировать"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Empty State Component - ChatGPT style
function EmptyState({ onPromptClick }: { onPromptClick: (prompt: string) => void }) {
  const examplePrompts = [
    {
      icon: '💡',
      title: 'Объяснение',
      text: 'Объясни квантовые вычисления простыми словами'
    },
    {
      icon: '💻',
      title: 'Программирование',
      text: 'Напиши функцию для сортировки массива на JavaScript'
    },
    {
      icon: '📚',
      title: 'Рекомендации',
      text: 'Какие книги стоит прочитать начинающему программисту?'
    },
    {
      icon: '🏗️',
      title: 'Архитектура',
      text: 'Расскажи про архитектуру микросервисов'
    },
  ];

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-[#212121]">
      <div className="max-w-3xl w-full text-center space-y-8">
        <div className="space-y-3">
          <h1 className="text-5xl font-bold text-[#ececec]">wesk.cc</h1>
          <p className="text-[#8e8e8e] text-lg">
            Как я могу помочь вам сегодня?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-12">
          {examplePrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => onPromptClick(prompt.text)}
              className="p-4 bg-[#2f2f2f] hover:bg-[#3a3a3a] border border-white/10 rounded-2xl text-left transition-all group"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{prompt.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[#ececec] font-medium mb-1 text-sm">
                    {prompt.title}
                  </div>
                  <div className="text-[#8e8e8e] text-sm group-hover:text-[#ececec] transition-colors">
                    {prompt.text}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
