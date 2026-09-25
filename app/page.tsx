'use client';

import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
import { useChatStore } from '@/lib/store';
import { useEffect } from 'react';

export default function Home() {
  const { appearanceSettings } = useChatStore();
  const { theme, background, accentColor } = appearanceSettings;

  useEffect(() => {
    // Apply theme
    const root = document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const effectiveTheme = theme === 'system' ? systemTheme : theme;

    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);

    // Apply accent color
    root.style.setProperty('--accent-color', accentColor);
  }, [theme, accentColor]);

  const getBackgroundStyle = () => {
    switch (background.type) {
      case 'solid':
        return { backgroundColor: background.solidColor || '#212121' };

      case 'gradient':
        return {
          background: `linear-gradient(${background.gradientAngle || 135}deg, ${background.gradientStart || '#212121'}, ${background.gradientEnd || '#2f2f2f'})`,
        };

      case 'pattern':
        const patternColor = background.patternColor || '#3f3f3f';
        const pattern = background.patternType === 'dots'
          ? `radial-gradient(circle, ${patternColor} 1px, transparent 1px)`
          : `linear-gradient(${patternColor} 1px, transparent 1px), linear-gradient(90deg, ${patternColor} 1px, transparent 1px)`;

        return {
          backgroundImage: pattern,
          backgroundSize: background.patternType === 'dots' ? '20px 20px' : '20px 20px, 20px 20px',
          backgroundColor: '#212121',
        };

      case 'image':
        if (background.imageUrl) {
          return {
            backgroundImage: `url(${background.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          };
        }
        return {};

      default:
        return {};
    }
  };

  const getBackgroundOverlay = () => {
    if (background.type === 'image' && background.imageUrl) {
      return (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: 'rgba(33, 33, 33, 0.7)',
            backdropFilter: background.imageBlur ? `blur(${background.imageBlur}px)` : undefined,
          }}
        />
      );
    }
    return null;
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#212121] text-[#ececec]">
      {/* Background Layer */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          ...getBackgroundStyle(),
          opacity: background.type === 'image' && background.imageUrl ? background.imageOpacity || 1 : 1,
        }}
      />

      {/* Background Overlay */}
      {getBackgroundOverlay()}

      {/* Main Content */}
      <div className="relative z-0 flex w-full h-full">
        <Sidebar />
        <ChatArea />
      </div>
    </div>
  );
}
