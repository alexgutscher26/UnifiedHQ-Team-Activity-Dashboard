'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getDefaultTheme, getAllThemes, type ThemeConfig } from '@/lib/themes';

interface CustomThemeContextType {
  currentTheme: ThemeConfig;
  setTheme: (themeName: string) => void;
  availableThemes: ThemeConfig[];
}

const CustomThemeContext = createContext<CustomThemeContextType | undefined>(
  undefined
);

const THEME_STORAGE_KEY = 'custom-theme';

/**
 * Provides a custom theme context for the application.
 *
 * This component initializes the current theme based on the default theme and retrieves available themes.
 * It also loads a saved theme from localStorage on mount, applying it to the document if found.
 * The `setTheme` function allows changing the theme and updates localStorage accordingly.
 * The component renders a context provider that supplies the current theme, available themes, and the function to set a new theme.
 *
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to be rendered within the provider.
 */
export function CustomThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentTheme, setCurrentTheme] =
    useState<ThemeConfig>(getDefaultTheme());
  const [availableThemes] = useState<ThemeConfig[]>(getAllThemes());

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme) {
      const theme = availableThemes.find(t => t.name === savedTheme);
      if (theme) {
        setCurrentTheme(theme);
        applyThemeToDocument(theme.name);
      }
    }
  }, [availableThemes]);

  /**
   * Sets the current theme based on the provided theme name.
   */
  const setTheme = (themeName: string) => {
    const theme = availableThemes.find(t => t.name === themeName);
    if (theme) {
      setCurrentTheme(theme);
      localStorage.setItem(THEME_STORAGE_KEY, themeName);
      applyThemeToDocument(themeName);
    }
  };

  /**
   * Applies a theme to the document by setting a data attribute.
   */
  const applyThemeToDocument = (themeName: string) => {
    // Remove existing theme classes
    document.documentElement.removeAttribute('data-theme');

    // Apply new theme
    if (themeName !== 'default') {
      document.documentElement.setAttribute('data-theme', themeName);
    }
  };

  return (
    <CustomThemeContext.Provider
      value={{
        currentTheme,
        setTheme,
        availableThemes,
      }}
    >
      {children}
    </CustomThemeContext.Provider>
  );
}

/**
 * Retrieves the custom theme context.
 */
export function useCustomTheme() {
  const context = useContext(CustomThemeContext);
  if (context === undefined) {
    throw new Error('useCustomTheme must be used within a CustomThemeProvider');
  }
  return context;
}
