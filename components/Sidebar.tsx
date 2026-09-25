'use client';

import { useChatStore } from '@/lib/store';
import {
  Search,
  MessageSquarePlus,
  Settings,
  Pin,
  Archive,
  MoreVertical,
  Trash2,
  Edit2,
  Download,
  Eraser,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import SettingsModalComponent from './SettingsModal';

export default function Sidebar() {
  const {
    chats,
    currentChatId,
    createChat,
    setCurrentChat,
    deleteChat,
    pinChat,
    archiveChat,
    renameChat,
    clearChat,
    exportChat,
    sidebarOpen,
    toggleSidebar,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleNewChat = () => {
    createChat();
  };

  const handleRename = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
    setMenuOpenId(null);
  };

  const saveRename = () => {
    if (editingId && editTitle.trim()) {
      renameChat(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleExport = (id: string, format: 'markdown' | 'json') => {
    const content = exportChat(id, format);
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${id}.${format === 'json' ? 'json' : 'md'}`;
    a.click();
    URL.revokeObjectURL(url);
    setMenuOpenId(null);
  };

  const filteredChats = chats.filter((chat) =>
    !chat.archived && chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedChats = filteredChats.filter((chat) => chat.pinned);
  const regularChats = filteredChats.filter((chat) => !chat.pinned);

  if (!sidebarOpen) {
    return (
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
        aria-label="Открыть боковую панель"
      >
        <Menu className="w-5 h-5" />
      </button>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        onClick={toggleSidebar}
      />

      {/* Sidebar */}
      <div className="fixed lg:relative w-64 h-full bg-[#171717] border-r border-white/10 flex flex-col z-40">
        {/* Header */}
        <div className="p-3 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold text-[#ececec]">wesk.cc</h1>
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Закрыть боковую панель"
            >
              <X className="w-5 h-5 text-[#ececec]" />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 bg-white/10 hover:bg-white/20 text-[#ececec] rounded-lg font-medium transition-colors"
            aria-label="Создать новый чат"
          >
            <MessageSquarePlus className="w-5 h-5" />
            Новый чат
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e8e]" />
            <input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-[#2f2f2f] border border-white/10 rounded-lg text-sm text-[#ececec] placeholder-[#8e8e8e] focus:outline-none focus:border-white/20 transition-colors"
              aria-label="Поиск по чатам"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {pinnedChats.length > 0 && (
            <div className="p-2">
              <div className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-[#8e8e8e] uppercase">
                <Pin className="w-3.5 h-3.5" />
                Закреплённые
              </div>
              {pinnedChats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isActive={chat.id === currentChatId}
                  isEditing={editingId === chat.id}
                  editTitle={editTitle}
                  menuOpen={menuOpenId === chat.id}
                  onSelect={() => setCurrentChat(chat.id)}
                  onMenuToggle={() => setMenuOpenId(menuOpenId === chat.id ? null : chat.id)}
                  onPin={() => pinChat(chat.id)}
                  onArchive={() => archiveChat(chat.id)}
                  onRename={() => handleRename(chat.id, chat.title)}
                  onDelete={() => {
                    if (confirm('Удалить этот чат?')) {
                      deleteChat(chat.id);
                      setMenuOpenId(null);
                    }
                  }}
                  onClear={() => {
                    if (confirm('Очистить все сообщения в этом чате?')) {
                      clearChat(chat.id);
                      setMenuOpenId(null);
                    }
                  }}
                  onExport={(format: 'markdown' | 'json') => handleExport(chat.id, format)}
                  onEditTitleChange={setEditTitle}
                  onEditTitleSave={saveRename}
                  onEditTitleCancel={() => setEditingId(null)}
                />
              ))}
            </div>
          )}

          {regularChats.length > 0 && (
            <div className="p-2">
              {pinnedChats.length > 0 && (
                <div className="px-3 py-1 text-xs font-medium text-[#8e8e8e] uppercase">
                  Чаты
                </div>
              )}
              {regularChats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isActive={chat.id === currentChatId}
                  isEditing={editingId === chat.id}
                  editTitle={editTitle}
                  menuOpen={menuOpenId === chat.id}
                  onSelect={() => setCurrentChat(chat.id)}
                  onMenuToggle={() => setMenuOpenId(menuOpenId === chat.id ? null : chat.id)}
                  onPin={() => pinChat(chat.id)}
                  onArchive={() => archiveChat(chat.id)}
                  onRename={() => handleRename(chat.id, chat.title)}
                  onDelete={() => {
                    if (confirm('Удалить этот чат?')) {
                      deleteChat(chat.id);
                      setMenuOpenId(null);
                    }
                  }}
                  onClear={() => {
                    if (confirm('Очистить все сообщения в этом чате?')) {
                      clearChat(chat.id);
                      setMenuOpenId(null);
                    }
                  }}
                  onExport={(format: 'markdown' | 'json') => handleExport(chat.id, format)}
                  onEditTitleChange={setEditTitle}
                  onEditTitleSave={saveRename}
                  onEditTitleCancel={() => setEditingId(null)}
                />
              ))}
            </div>
          )}

          {filteredChats.length === 0 && (
            <div className="p-8 text-center text-[#8e8e8e] text-sm">
              {searchQuery ? 'Чаты не найдены' : 'Нет чатов'}
            </div>
          )}
        </div>

        {/* Settings Button */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/10 text-[#ececec] rounded-lg transition-colors"
            aria-label="Настройки"
          >
            <Settings className="w-5 h-5" />
            Настройки
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModalComponent onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}

// ChatItem Component
function ChatItem({
  chat,
  isActive,
  isEditing,
  editTitle,
  menuOpen,
  onSelect,
  onMenuToggle,
  onPin,
  onArchive,
  onRename,
  onDelete,
  onClear,
  onExport,
  onEditTitleChange,
  onEditTitleSave,
  onEditTitleCancel,
}: any) {
  return (
    <div className="relative group">
      {isEditing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => onEditTitleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onEditTitleSave();
            if (e.key === 'Escape') onEditTitleCancel();
          }}
          onBlur={onEditTitleSave}
          autoFocus
          className="w-full px-3 py-2 bg-[#2f2f2f] border border-[#19c37d] rounded-lg text-sm text-[#ececec] focus:outline-none"
        />
      ) : (
        <div
          onClick={onSelect}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${
            isActive
              ? 'bg-[#2f2f2f] text-[#ececec]'
              : 'text-[#ececec] hover:bg-white/10'
          }`}
        >
          <span className="flex-1 truncate">{chat.title}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMenuToggle();
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-opacity"
            aria-label="Меню чата"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Context Menu */}
      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-[#2f2f2f] border border-white/10 rounded-lg shadow-xl z-50 py-1">
          <button
            onClick={onRename}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#ececec] hover:bg-white/10 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Переименовать
          </button>
          <button
            onClick={onPin}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#ececec] hover:bg-white/10 transition-colors"
          >
            <Pin className="w-4 h-4" />
            {chat.pinned ? 'Открепить' : 'Закрепить'}
          </button>
          <button
            onClick={onClear}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#ececec] hover:bg-white/10 transition-colors"
          >
            <Eraser className="w-4 h-4" />
            Очистить
          </button>
          <button
            onClick={() => onExport('markdown')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#ececec] hover:bg-white/10 transition-colors"
          >
            <Download className="w-4 h-4" />
            Экспорт в Markdown
          </button>
          <button
            onClick={() => onExport('json')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#ececec] hover:bg-white/10 transition-colors"
          >
            <Download className="w-4 h-4" />
            Экспорт в JSON
          </button>
          <button
            onClick={onArchive}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#ececec] hover:bg-white/10 transition-colors"
          >
            <Archive className="w-4 h-4" />
            В архив
          </button>
          <div className="my-1 border-t border-white/10" />
          <button
            onClick={onDelete}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Удалить
          </button>
        </div>
      )}
    </div>
  );
}
