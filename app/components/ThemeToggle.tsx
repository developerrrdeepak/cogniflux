
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by rendering nothing until mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
    );
  }

  const toggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggle}
      className="relative p-2 rounded-full transition-all duration-300 hover:bg-gray-200 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 group"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label="Toggle theme"
    >
      <div className="relative w-6 h-6 overflow-hidden">
        {/* Sun Icon (Show when Light) */}
        <svg
          className={`absolute inset-0 w-6 h-6 text-yellow-500 transition-all duration-500 transform ${
            theme === "light" 
              ? "rotate-0 opacity-100 scale-100" 
              : "rotate-90 opacity-0 scale-50"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>

        {/* Moon Icon (Show when Dark) */}
        <svg
          className={`absolute inset-0 w-6 h-6 text-blue-400 transition-all duration-500 transform ${
            theme === "dark" 
              ? "rotate-0 opacity-100 scale-100" 
              : "-rotate-90 opacity-0 scale-50"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      </div>
      
      {/* Glow Effect on Hover */}
      <span className="absolute inset-0 rounded-full bg-yellow-400/20 dark:bg-blue-400/20 scale-0 group-hover:scale-100 transition-transform duration-300" />
    </button>
  );
}
