import React, { useState, useEffect } from 'react';
import { savePreference, getPreference, hasConsentFor } from '@/lib/cookies';

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    // Try cookie first (if consent given), then localStorage, then system preference
    const cookieTheme = getPreference('theme');
    if (cookieTheme) {
      return cookieTheme === 'dark';
    }

    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const theme = isDark ? 'dark' : 'light';

    // Apply theme to document
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Save to localStorage (always)
    localStorage.setItem('theme', theme);

    // Save to cookie (if consent given)
    if (hasConsentFor('functional')) {
      savePreference('theme', theme);
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return { isDark, toggleTheme };
}
