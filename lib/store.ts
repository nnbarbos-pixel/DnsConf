import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Chat, Message, AppearanceSettings, ModelSettings } from '@/types/chat';

interface ChatStore {
  chats: Chat[];
  currentChatId: string | null;
  appearanceSettings: AppearanceSettings;
  modelSettings: ModelSettings;
  sidebarOpen: boolean;

  // Chat actions
  createChat: (model?: string, systemPrompt?: string) => string;
  deleteChat: (id: string) => void;
  renameChat: (id: string, title: string) => void;
  pinChat: (id: string) => void;
  archiveChat: (id: string) => void;
  clearChat: (id: string) => void;
  setCurrentChat: (id: string | null) => void;

  // Message actions
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (chatId: string, messageId: string, content: string) => void;
  deleteMessage: (chatId: string, messageId: string) => void;

  // Settings actions
  updateAppearanceSettings: (settings: Partial<AppearanceSettings>) => void;
  updateModelSettings: (settings: Partial<ModelSettings>) => void;

  // UI actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Export
  exportChat: (id: string, format: 'markdown' | 'json') => string;
}

const defaultAppearanceSettings: AppearanceSettings = {
  theme: 'dark',
  accentColor: '#19c37d',
  fontSize: 'medium',
  chatWidth: 'medium',
  density: 'comfortable',
  messageStyle: 'bubbles',
  sidebarPosition: 'left',
  animations: true,
  background: {
    type: 'default',
  },
};

const defaultModelSettings: ModelSettings = {
  model: 'claude-sonnet-5',
  temperature: 1.0,
  maxTokens: 4096,
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      chats: [],
      currentChatId: null,
      appearanceSettings: defaultAppearanceSettings,
      modelSettings: defaultModelSettings,
      sidebarOpen: true,

      createChat: (model, systemPrompt) => {
        const id = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newChat: Chat = {
          id,
          title: 'Новый чат',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          pinned: false,
          archived: false,
          model: model || get().modelSettings.model,
          systemPrompt,
        };

        set((state) => ({
          chats: [newChat, ...state.chats],
          currentChatId: id,
        }));

        return id;
      },

      deleteChat: (id) => {
        set((state) => ({
          chats: state.chats.filter((chat) => chat.id !== id),
          currentChatId: state.currentChatId === id ? null : state.currentChatId,
        }));
      },

      renameChat: (id, title) => {
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === id ? { ...chat, title, updatedAt: Date.now() } : chat
          ),
        }));
      },

      pinChat: (id) => {
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === id ? { ...chat, pinned: !chat.pinned } : chat
          ),
        }));
      },

      archiveChat: (id) => {
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === id ? { ...chat, archived: !chat.archived } : chat
          ),
        }));
      },

      clearChat: (id) => {
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === id ? { ...chat, messages: [], updatedAt: Date.now() } : chat
          ),
        }));
      },

      setCurrentChat: (id) => {
        set({ currentChatId: id });
      },

      addMessage: (chatId, message) => {
        const newMessage: Message = {
          ...message,
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        };

        set((state) => ({
          chats: state.chats.map((chat) => {
            if (chat.id !== chatId) return chat;

            const messages = [...chat.messages, newMessage];
            let title = chat.title;

            // Auto-generate title from first user message
            if (messages.length === 1 && message.role === 'user') {
              title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '');
            }

            return {
              ...chat,
              messages,
              title,
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      updateMessage: (chatId, messageId, content) => {
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: chat.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, content } : msg
                  ),
                  updatedAt: Date.now(),
                }
              : chat
          ),
        }));
      },

      deleteMessage: (chatId, messageId) => {
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: chat.messages.filter((msg) => msg.id !== messageId),
                  updatedAt: Date.now(),
                }
              : chat
          ),
        }));
      },

      updateAppearanceSettings: (settings) => {
        set((state) => ({
          appearanceSettings: { ...state.appearanceSettings, ...settings },
        }));
      },

      updateModelSettings: (settings) => {
        set((state) => ({
          modelSettings: { ...state.modelSettings, ...settings },
        }));
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },

      exportChat: (id, format) => {
        const chat = get().chats.find((c) => c.id === id);
        if (!chat) return '';

        if (format === 'json') {
          return JSON.stringify(chat, null, 2);
        }

        // Markdown format
        let md = `# ${chat.title}\n\n`;
        md += `Дата создания: ${new Date(chat.createdAt).toLocaleString('ru-RU')}\n`;
        md += `Модель: ${chat.model}\n\n`;

        if (chat.systemPrompt) {
          md += `## Системный промпт\n\n${chat.systemPrompt}\n\n`;
        }

        md += `## Сообщения\n\n`;

        chat.messages.forEach((msg) => {
          const role = msg.role === 'user' ? 'Пользователь' : 'Ассистент';
          const date = new Date(msg.timestamp).toLocaleString('ru-RU');
          md += `### ${role} (${date})\n\n${msg.content}\n\n`;
        });

        return md;
      },
    }),
    {
      name: 'wesk-chat-storage',
      version: 3,
      partialize: (state) => ({
        chats: state.chats,
        appearanceSettings: state.appearanceSettings,
        modelSettings: state.modelSettings,
      }),
      migrate: (persistedState: any, version: number) => {
        // Миграция старой модели на новую
        if (persistedState?.modelSettings?.model && persistedState.modelSettings.model.includes('claude')) {
          persistedState.modelSettings.model = 'claude-sonnet-5';
        }

        // Миграция старой модели в чатах
        if (persistedState?.chats) {
          persistedState.chats = persistedState.chats.map((chat: any) => ({
            ...chat,
            model: chat.model?.includes('claude') ? 'claude-sonnet-5' : chat.model,
          }));
        }

        return persistedState;
      },
    }
  )
);

// Принудительная миграция при загрузке - исправляет старые модели
if (typeof window !== 'undefined') {
  const state = useChatStore.getState();

  // Проверяем и исправляем модель в настройках
  if (state.modelSettings.model && !state.modelSettings.model.startsWith('claude-sonnet-5') && !state.modelSettings.model.startsWith('claude-opus-5') && !state.modelSettings.model.startsWith('claude-fable-5') && !state.modelSettings.model.startsWith('claude-haiku-4-5')) {
    useChatStore.setState({
      modelSettings: {
        ...state.modelSettings,
        model: 'claude-sonnet-5',
      },
    });
  }

  // Проверяем и исправляем модели в чатах
  const needsUpdate = state.chats.some(chat =>
    chat.model && !chat.model.startsWith('claude-sonnet-5') && !chat.model.startsWith('claude-opus-5') && !chat.model.startsWith('claude-fable-5') && !chat.model.startsWith('claude-haiku-4-5')
  );

  if (needsUpdate) {
    useChatStore.setState({
      chats: state.chats.map(chat => ({
        ...chat,
        model: chat.model?.startsWith('claude-') && !chat.model.startsWith('claude-sonnet-5') && !chat.model.startsWith('claude-opus-5') && !chat.model.startsWith('claude-fable-5') && !chat.model.startsWith('claude-haiku-4-5')
          ? 'claude-sonnet-5'
          : chat.model,
      })),
    });
  }
}
