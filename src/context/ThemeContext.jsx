import { createContext, useContext, useEffect, useState } from "react";

import {
  BACKGROUND_CSS_VARS,
  BACKGROUND_THEMES,
  DEFAULT_BACKGROUND,
  PLAIN_BACKGROUNDS,
  PLAIN_CSS_VARS,
} from "@/constants/backgroundThemes";

const ThemeContext = createContext(undefined);

const STORAGE_KEY = "trydood-theme";
const BACKGROUND_STORAGE_KEY = "trydood-background";
const PLAIN_STORAGE_KEY = "trydood-plain-background";

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    // storage blocked (private mode) — choice just won't survive a reload
  }
}

const isPlainId = (id) => PLAIN_BACKGROUNDS.some((b) => b.id === id);

/** Theme Color id (accent + gradient). */
function readStoredBackground() {
  const stored = readStorage(BACKGROUND_STORAGE_KEY);
  return BACKGROUND_THEMES.some((b) => b.id === stored) ? stored : DEFAULT_BACKGROUND;
}

/**
 * Plain Background id, or null for "use the Theme Color's gradient".
 * Also picks up a plain id saved under the old single-choice key, from
 * before Theme Color and Plain Background were separate choices.
 */
function readStoredPlainBackground() {
  const stored = readStorage(PLAIN_STORAGE_KEY);
  if (isPlainId(stored)) return stored;
  const legacy = readStorage(BACKGROUND_STORAGE_KEY);
  return isPlainId(legacy) ? legacy : null;
}

/** Sets (or, with no preset, clears) one data attribute + its CSS vars on <html>. */
function setPresetOnRoot(root, attribute, varMap, preset) {
  if (!preset) {
    root.removeAttribute(attribute);
    Object.values(varMap).forEach((cssVar) => root.style.removeProperty(cssVar));
    return;
  }
  root.setAttribute(attribute, preset.id);
  Object.entries(varMap).forEach(([field, cssVar]) => {
    root.style.setProperty(cssVar, preset[field]);
  });
}

// Writes both independent choices onto <html> (read by index.css):
//   - Theme Color      → `data-bg` + accent/gradient vars (none for the
//     default green, so the original CSS applies untouched)
//   - Plain Background → `data-bg-solid` + solid colour vars; replaces just
//     the page background, so the Theme Color's accent (buttons, text,
//     badges) still applies on top of it
function applyBackground(themeId, plainId) {
  const root = document.documentElement;
  const theme = BACKGROUND_THEMES.find((b) => b.id === themeId && b.id !== DEFAULT_BACKGROUND);
  const plain = PLAIN_BACKGROUNDS.find((b) => b.id === plainId);

  setPresetOnRoot(root, "data-bg", BACKGROUND_CSS_VARS, theme);
  setPresetOnRoot(root, "data-bg-solid", PLAIN_CSS_VARS, plain);
}

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

  // Settings → Appearance: Theme Color (accent + gradient) and an optional
  // Plain Background that replaces only the gradient.
  const [background, setBackground] = useState(readStoredBackground);
  const [plainBackground, setPlainBackground] = useState(readStoredPlainBackground);

  useEffect(() => {
    applyBackground(background, plainBackground);
    writeStorage(BACKGROUND_STORAGE_KEY, background);
    writeStorage(PLAIN_STORAGE_KEY, plainBackground);
  }, [background, plainBackground]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === "dark",
        background,
        setBackground,
        plainBackground,
        setPlainBackground,
      }}
    >
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
