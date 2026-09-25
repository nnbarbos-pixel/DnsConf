export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
  archived: boolean;
  model: string;
  systemPrompt?: string;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  chatWidth: 'narrow' | 'medium' | 'wide' | 'full';
  density: 'compact' | 'comfortable' | 'spacious';
  messageStyle: 'bubbles' | 'flat';
  sidebarPosition: 'left' | 'right';
  animations: boolean;
  background: BackgroundSettings;
}

export interface BackgroundSettings {
  type: 'default' | 'solid' | 'gradient' | 'pattern' | 'image';
  solidColor?: string;
  gradientStart?: string;
  gradientEnd?: string;
  gradientAngle?: number;
  patternType?: 'grid' | 'dots';
  patternColor?: string;
  imageUrl?: string;
  imageOpacity?: number;
  imageBlur?: number;
}

export interface ModelSettings {
  model: string;
  temperature: number;
  maxTokens: number;
}
