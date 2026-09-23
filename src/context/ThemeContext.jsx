import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(undefined);

const STORAGE_KEY = "trydood-theme";

// App-wide light/dark theme, via Context (not Zustand) per explicit
// instruction — replaces the old themeStore.js, which only ever drove a
// local preview on the Settings page itself. Toggling here adds/removes
// the `dark` class on <html>, which is what index.css's
// `@custom-variant dark` hooks Tailwind's `dark:` utilities off of, so
// every page that has a `dark:` class responds automatically.
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- co-locating the hook with its Provider is the standard Context pattern; splitting into a second file for this alone isn't worth it.
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
