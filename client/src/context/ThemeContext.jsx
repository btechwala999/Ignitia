import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the ThemeContext
const ThemeContext = createContext(null);

// Create the ThemeProvider component
export function ThemeProvider({ children }) {
  // Always use light mode, regardless of localStorage or system preference
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Function to toggle theme (disabled, but kept for API compatibility)
  const toggleTheme = () => {
    // Do nothing - we are keeping light mode only
    return;
  };

  // Ensure document is always in light mode
  useEffect(() => {
    // Remove dark class to force light mode
    document.documentElement.classList.remove('dark');
    
    // Set light theme in localStorage for consistency
    localStorage.setItem('theme', 'light');
  }, []);

  // Create theme context value
  const value = {
    isDarkMode: false,  // Always false
    toggleTheme         // Function does nothing but is kept for compatibility
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Custom hook to use the theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Export the context for advanced usage
export default ThemeContext; 