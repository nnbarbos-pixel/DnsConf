'use client';

import { useChatStore } from '@/lib/store';
import {
  X,
  Sun,
  Moon,
  Monitor,
  Type,
  Layout,
  Layers,
  MessageSquare,
  Sidebar as SidebarIcon,
  Sparkles,
  Palette,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
} from 'lucide-react';
import { useState } from 'react';
import type { AppearanceSettings, BackgroundSettings } from '@/types/chat';

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { appearanceSettings, updateAppearanceSettings, modelSettings, updateModelSettings } = useChatStore();
  const [activeTab, setActiveTab] = useState<'appearance' | 'model'>('appearance');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg border border-slate-800 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-slate-100">Настройки</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'appearance'
                ? 'text-sky-400 border-b-2 border-sky-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Внешний вид
          </button>
          <button
            onClick={() => setActiveTab('model')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'model'
                ? 'text-sky-400 border-b-2 border-sky-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Модель
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'appearance' ? (
            <AppearanceSettings
              settings={appearanceSettings}
              onUpdate={updateAppearanceSettings}
            />
          ) : (
            <ModelSettings settings={modelSettings} onUpdate={updateModelSettings} />
          )}
        </div>
      </div>
    </div>
  );
}

function AppearanceSettings({
  settings,
  onUpdate,
}: {
  settings: AppearanceSettings;
  onUpdate: (settings: Partial<AppearanceSettings>) => void;
}) {
  const [showBackgroundSettings, setShowBackgroundSettings] = useState(false);

  const accentColors = [
    { name: 'Небесный', value: '#38BDF8' },
    { name: 'Голубой', value: '#22D3EE' },
    { name: 'Бирюзовый', value: '#4FD1C5' },
    { name: 'Оранжевый', value: '#F97316' },
    { name: 'Янтарный', value: '#F59E0B' },
    { name: 'Латунь', value: '#C9A24B' },
    { name: 'Розовый', value: '#EC4899' },
    { name: 'Фиолетовый', value: '#A855F7' },
  ];

  return (
    <div className="space-y-6">
      {/* Theme */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
          <Sun className="w-4 h-4" />
          Тема
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'light', label: 'Светлая', icon: Sun },
            { value: 'dark', label: 'Тёмная', icon: Moon },
            { value: 'system', label: 'Системная', icon: Monitor },
          ].map((theme) => (
            <button
              key={theme.value}
              onClick={() => onUpdate({ theme: theme.value as any })}
              className={`p-3 rounded-lg border-2 transition-colors ${
                settings.theme === theme.value
                  ? 'border-sky-500 bg-sky-500/10'
                  : 'border-slate-700 bg-slate-800 hover:border-slate-600'
              }`}
            >
              <theme.icon className="w-5 h-5 mx-auto mb-1" />
              <div className="text-xs text-slate-300">{theme.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
          <Palette className="w-4 h-4" />
          Цвет акцента
        </label>
        <div className="grid grid-cols-4 gap-3">
          {accentColors.map((color) => (
            <button
              key={color.value}
              onClick={() => onUpdate({ accentColor: color.value })}
              className={`p-3 rounded-lg border-2 transition-colors ${
                settings.accentColor === color.value
                  ? 'border-sky-500 bg-slate-800'
                  : 'border-slate-700 bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div
                className="w-8 h-8 rounded-full mx-auto mb-1"
                style={{ backgroundColor: color.value }}
              />
              <div className="text-xs text-slate-300">{color.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
          <Type className="w-4 h-4" />
          Размер текста
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'small', label: 'Мелкий' },
            { value: 'medium', label: 'Средний' },
            { value: 'large', label: 'Крупный' },
          ].map((size) => (
            <button
              key={size.value}
              onClick={() => onUpdate({ fontSize: size.value as any })}
              className={`p-3 rounded-lg border transition-colors ${
                settings.fontSize === size.value
                  ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                  : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
              }`}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Width */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
          <Layout className="w-4 h-4" />
          Ширина области чата
        </label>
        <div className="grid grid-cols-4 gap-3">
          {[
            { value: 'narrow', label: 'Узкая' },
            { value: 'medium', label: 'Средняя' },
            { value: 'wide', label: 'Широкая' },
            { value: 'full', label: 'Полная' },
          ].map((width) => (
            <button
              key={width.value}
              onClick={() => onUpdate({ chatWidth: width.value as any })}
              className={`p-3 rounded-lg border transition-colors ${
                settings.chatWidth === width.value
                  ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                  : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
              }`}
            >
              {width.label}
            </button>
          ))}
        </div>
      </div>

      {/* Density */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
          <Layers className="w-4 h-4" />
          Плотность интерфейса
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'compact', label: 'Компактная' },
            { value: 'comfortable', label: 'Комфортная' },
            { value: 'spacious', label: 'Просторная' },
          ].map((density) => (
            <button
              key={density.value}
              onClick={() => onUpdate({ density: density.value as any })}
              className={`p-3 rounded-lg border transition-colors ${
                settings.density === density.value
                  ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                  : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
              }`}
            >
              {density.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message Style */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
          <MessageSquare className="w-4 h-4" />
          Стиль сообщений
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'bubbles', label: 'Пузыри' },
            { value: 'flat', label: 'Плоский' },
          ].map((style) => (
            <button
              key={style.value}
              onClick={() => onUpdate({ messageStyle: style.value as any })}
              className={`p-3 rounded-lg border transition-colors ${
                settings.messageStyle === style.value
                  ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                  : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar Position */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
          <SidebarIcon className="w-4 h-4" />
          Положение боковой панели
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'left', label: 'Слева' },
            { value: 'right', label: 'Справа' },
          ].map((position) => (
            <button
              key={position.value}
              onClick={() => onUpdate({ sidebarPosition: position.value as any })}
              className={`p-3 rounded-lg border transition-colors ${
                settings.sidebarPosition === position.value
                  ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                  : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
              }`}
            >
              {position.label}
            </button>
          ))}
        </div>
      </div>

      {/* Animations */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
          <Sparkles className="w-4 h-4" />
          Анимации
        </label>
        <label className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.animations}
            onChange={(e) => onUpdate({ animations: e.target.checked })}
            className="w-5 h-5 text-sky-500 bg-slate-700 border-slate-600 rounded focus:ring-sky-500"
          />
          <span className="text-sm text-slate-300">Включить анимации интерфейса</span>
        </label>
      </div>

      {/* Background Settings */}
      <div>
        <button
          onClick={() => setShowBackgroundSettings(!showBackgroundSettings)}
          className="flex items-center justify-between w-full p-3 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <ImageIcon className="w-4 h-4" />
            Настройки фона
          </div>
          <div className="text-slate-500">{showBackgroundSettings ? '▼' : '▶'}</div>
        </button>

        {showBackgroundSettings && (
          <div className="mt-3">
            <BackgroundSettingsPanel
              background={settings.background}
              onUpdate={(background) => onUpdate({ background })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function BackgroundSettingsPanel({
  background,
  onUpdate,
}: {
  background: BackgroundSettings;
  onUpdate: (background: BackgroundSettings) => void;
}) {
  const [imageUrl, setImageUrl] = useState('');

  const backgroundTypes = [
    { value: 'default', label: 'Стандартный' },
    { value: 'solid', label: 'Однотонный' },
    { value: 'gradient', label: 'Градиент' },
    { value: 'pattern', label: 'Узор' },
    { value: 'image', label: 'Изображение' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        onUpdate({ ...background, type: 'image', imageUrl: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = () => {
    if (imageUrl.trim()) {
      onUpdate({ ...background, type: 'image', imageUrl: imageUrl.trim() });
      setImageUrl('');
    }
  };

  return (
    <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
      {/* Background Type */}
      <div className="grid grid-cols-5 gap-2">
        {backgroundTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => onUpdate({ ...background, type: type.value as any })}
            className={`p-2 text-xs rounded border transition-colors ${
              background.type === type.value
                ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Solid Color */}
      {background.type === 'solid' && (
        <div>
          <label className="block text-xs text-slate-400 mb-2">Цвет фона</label>
          <input
            type="color"
            value={background.solidColor || '#0F172A'}
            onChange={(e) => onUpdate({ ...background, solidColor: e.target.value })}
            className="w-full h-10 rounded border border-slate-700 bg-slate-800"
          />
        </div>
      )}

      {/* Gradient */}
      {background.type === 'gradient' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-2">Начальный цвет</label>
            <input
              type="color"
              value={background.gradientStart || '#0F172A'}
              onChange={(e) => onUpdate({ ...background, gradientStart: e.target.value })}
              className="w-full h-10 rounded border border-slate-700 bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-2">Конечный цвет</label>
            <input
              type="color"
              value={background.gradientEnd || '#1E293B'}
              onChange={(e) => onUpdate({ ...background, gradientEnd: e.target.value })}
              className="w-full h-10 rounded border border-slate-700 bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-2">Угол: {background.gradientAngle || 135}°</label>
            <input
              type="range"
              min="0"
              max="360"
              value={background.gradientAngle || 135}
              onChange={(e) => onUpdate({ ...background, gradientAngle: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Pattern */}
      {background.type === 'pattern' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-2">Тип узора</label>
            <div className="grid grid-cols-2 gap-2">
              {['grid', 'dots'].map((pattern) => (
                <button
                  key={pattern}
                  onClick={() => onUpdate({ ...background, patternType: pattern as any })}
                  className={`p-2 text-xs rounded border transition-colors ${
                    background.patternType === pattern
                      ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                      : 'border-slate-700 bg-slate-800 text-slate-300'
                  }`}
                >
                  {pattern === 'grid' ? 'Сетка' : 'Точки'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-2">Цвет узора</label>
            <input
              type="color"
              value={background.patternColor || '#334155'}
              onChange={(e) => onUpdate({ ...background, patternColor: e.target.value })}
              className="w-full h-10 rounded border border-slate-700 bg-slate-800"
            />
          </div>
        </div>
      )}

      {/* Image */}
      {background.type === 'image' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-2">Загрузить изображение</label>
            <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-700 hover:border-sky-500 rounded-lg cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span className="text-sm text-slate-300">Выбрать файл</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2">Или введите URL изображения</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              <button
                onClick={handleUrlSubmit}
                className="px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded text-sm transition-colors"
              >
                <LinkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {background.imageUrl && (
            <>
              <div>
                <label className="block text-xs text-slate-400 mb-2">Прозрачность: {Math.round((background.imageOpacity || 1) * 100)}%</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={background.imageOpacity || 1}
                  onChange={(e) => onUpdate({ ...background, imageOpacity: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-2">Размытие: {background.imageBlur || 0}px</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={background.imageBlur || 0}
                  onChange={(e) => onUpdate({ ...background, imageBlur: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Reset Button */}
      {background.type !== 'default' && (
        <button
          onClick={() => onUpdate({ type: 'default' })}
          className="w-full p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded transition-colors"
        >
          Сбросить фон
        </button>
      )}
    </div>
  );
}

function ModelSettings({ settings, onUpdate }: any) {
  const [selectedCategory, setSelectedCategory] = useState('claude');

  const modelCategories = {
    claude: {
      name: 'Claude',
      models: [
        { value: 'claude-sonnet-5', label: 'Sonnet 5', price: '$0.20/$0.98', tokens: '1M', badge: 'Рекомендуется' },
        { value: 'claude-opus-5', label: 'Opus 5', price: '$0.49/$2.46', tokens: '1M' },
        { value: 'claude-fable-5-1', label: 'Fable 5.1', price: '$1.97/$9.84', tokens: '1M' },
        { value: 'claude-fable-5', label: 'Fable 5', price: '$4.71/$23.53', tokens: '1M' },
        { value: 'claude-haiku-4-5', label: 'Haiku 4.5', price: '$0.20/$0.98', tokens: '200K' },
        { value: 'claude-sonnet-4-6', label: 'Sonnet 4.6', price: '$0.30/$1.48', tokens: '200K' },
        { value: 'claude-opus-4-6', label: 'Opus 4.6', price: '$0.49/$2.46', tokens: '200K' },
        { value: 'claude-opus-4-7', label: 'Opus 4.7', price: '$0.49/$2.46', tokens: '200K' },
        { value: 'claude-opus-4-8', label: 'Opus 4.8', price: '$0.49/$2.46', tokens: '200K' },
      ]
    },
    gpt: {
      name: 'GPT',
      models: [
        { value: 'gpt-6-astra', label: 'GPT 6 Astra', price: '$0.85/$4.26', tokens: '>272K' },
        { value: 'gpt-6-sol', label: 'GPT 6 Sol', price: '$0.17/$0.85', tokens: '>272K' },
        { value: 'gpt-6-luna', label: 'GPT 6 Luna', price: '$0.013/$0.066', tokens: '>272K' },
        { value: 'gpt-5.6-sol', label: 'GPT 5.6 Sol', price: '$0.43/$2.56', tokens: '>272K' },
        { value: 'gpt-5.6-terra', label: 'GPT 5.6 Terra', price: '$0.17/$1.02', tokens: '>272K' },
        { value: 'gpt-5.6-luna', label: 'GPT 5.6 Luna', price: '$0.026/$0.16', tokens: '>272K' },
        { value: 'gpt-5.5', label: 'GPT 5.5', price: '$0.43/$2.56', tokens: '>272K' },
        { value: 'gpt-5.4-mini', label: 'GPT 5.4 Mini', price: '$0.098/$0.59', tokens: '128K' },
      ]
    },
    gemini: {
      name: 'Gemini',
      models: [
        { value: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', price: '$0.15/$0.74', tokens: '1M' },
        { value: 'gemini-3.7-flash', label: 'Gemini 3.7 Flash', price: '$0.15/$0.74', tokens: '1M' },
        { value: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash', price: '$0.30/$1.48', tokens: '1M' },
        { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', price: '$0.39/$2.36', tokens: '2M' },
        { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash', price: '$0.098/$0.59', tokens: '1M' },
      ]
    },
    other: {
      name: 'Другие',
      models: [
        { value: 'grok-4-7', label: 'Grok 4.7', price: '$0.098/$0.30', tokens: '>200K' },
        { value: 'grok-4-6', label: 'Grok 4.6', price: '$0.066/$0.20', tokens: '>200K' },
        { value: 'grok-4-5', label: 'Grok 4.5', price: '$0.066/$0.20', tokens: '>200K' },
        { value: 'deepseek-v4.1-flash', label: 'DeepSeek V4.1 Flash', price: '$0.24/$0.96', tokens: '128K' },
        { value: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro', price: '$0.88/$2.63', tokens: '128K' },
        { value: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash', price: '$0.24/$0.96', tokens: '128K' },
        { value: 'deepseek-v4-flash-vision-exp', label: 'DeepSeek V4 Flash Vision', price: '$0.29/$0.88', tokens: '128K' },
        { value: 'glm-5.3-flashx', label: 'GLM 5.3 FlashX', price: '$0.098/$0.34', tokens: '128K' },
        { value: 'glm-5.3-flash', label: 'GLM 5.3 Flash', price: '$0.039/$0.14', tokens: '128K' },
      ]
    },
    image: {
      name: 'Генерация изображений',
      models: [
        { value: 'gpt-image-2', label: 'GPT Image 2 (1K)', price: '$0.013/изобр', tokens: '-' },
        { value: 'gpt-image-2.5', label: 'GPT Image 2.5 (1K)', price: '$0.020/изобр', tokens: '-' },
        { value: 'gpt-image-2-vip', label: 'GPT Image 2 VIP (1K/2K/4K)', price: '$0.043/изобр', tokens: '-' },
        { value: 'nano-banana-2', label: 'Nano Banana 2 (1K/2K/4K)', price: '$0.039/изобр', tokens: '-' },
        { value: 'nano-banana-pro', label: 'Nano Banana Pro (1K/2K/4K)', price: '$0.059/изобр', tokens: '-' },
        { value: 'nano-banana-2-lite', label: 'Nano Banana 2 Lite', price: '$0.016/изобр', tokens: '-' },
      ]
    }
  };

  const currentCategory = modelCategories[selectedCategory as keyof typeof modelCategories];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">Категория</label>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(modelCategories).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === key
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">Модель</label>
        <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-2">
          {currentCategory.models.map((model) => (
            <button
              key={model.value}
              onClick={() => onUpdate({ model: model.value })}
              className={`p-3 rounded-lg border text-left transition-all ${
                settings.model === model.value
                  ? 'border-sky-500 bg-sky-500/10'
                  : 'border-slate-700 bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-100">{model.label}</span>
                    {model.badge && (
                      <span className="px-2 py-0.5 text-xs bg-sky-500/20 text-sky-400 rounded">
                        {model.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{model.price}</span>
                    <span>•</span>
                    <span>{model.tokens} токенов</span>
                  </div>
                </div>
                {settings.model === model.value && (
                  <div className="w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Температура: {settings.temperature.toFixed(1)}
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={settings.temperature}
          onChange={(e) => onUpdate({ temperature: parseFloat(e.target.value) })}
          className="w-full"
        />
        <p className="text-xs text-slate-500 mt-2">
          Более высокая температура делает ответы более креативными, но менее предсказуемыми
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Максимум токенов: {settings.maxTokens}
        </label>
        <input
          type="range"
          min="256"
          max="8192"
          step="256"
          value={settings.maxTokens}
          onChange={(e) => onUpdate({ maxTokens: parseInt(e.target.value) })}
          className="w-full"
        />
        <p className="text-xs text-slate-500 mt-2">
          Ограничивает длину ответа модели
        </p>
      </div>
    </div>
  );
}
