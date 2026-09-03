import React, { createContext, useContext, useState, useEffect } from 'react';
import { ConfigProvider, theme as antTheme } from 'antd';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  setMode: () => {},
  toggleMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('sonam_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('sonam_theme', newMode);
  };

  const toggleMode = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
    if (mode === 'dark') {
      document.body.style.backgroundColor = '#09090b';
      document.body.style.color = '#f8fafc';
    } else {
      document.body.style.backgroundColor = '#fafafa';
      document.body.style.color = '#0f172a';
    }
  }, [mode]);

  const isDark = mode === 'dark';
  const primaryRed = isDark ? '#ef4444' : '#dc2626';

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggleMode }}>
      <ConfigProvider
        theme={{
          algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
          token: {
            colorPrimary: primaryRed,
            borderRadius: 10,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            colorBgBase: isDark ? '#09090b' : '#fafafa',
            colorBgContainer: isDark ? '#18181b' : '#ffffff',
            colorBgElevated: isDark ? '#27272a' : '#ffffff',
            colorTextBase: isDark ? '#f8fafc' : '#0f172a',
            colorText: isDark ? '#f8fafc' : '#0f172a',
            colorTextSecondary: isDark ? '#9ca3af' : '#64748b',
            colorBorder: isDark ? '#27272a' : '#e2e8f0',
            colorBorderSecondary: isDark ? '#3f3f46' : '#f1f5f9',
          },
          components: {
            Card: {
              colorBgContainer: isDark ? '#18181b' : '#ffffff',
              colorBorderSecondary: isDark ? '#27272a' : '#f1f5f9',
            },
            Tabs: {
              colorBgContainer: isDark ? '#18181b' : '#ffffff',
              colorText: isDark ? '#9ca3af' : '#64748b',
            },
            Input: {
              colorBgContainer: isDark ? '#18181b' : '#ffffff',
              colorText: isDark ? '#f8fafc' : '#0f172a',
              colorBorder: isDark ? '#27272a' : '#d9d9d9',
            },
            Modal: {
              colorBgElevated: isDark ? '#18181b' : '#ffffff',
            },
            Select: {
              colorBgContainer: isDark ? '#18181b' : '#ffffff',
              colorText: isDark ? '#f8fafc' : '#0f172a',
            },
            DatePicker: {
              colorBgContainer: isDark ? '#18181b' : '#ffffff',
              colorText: isDark ? '#f8fafc' : '#0f172a',
            },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
