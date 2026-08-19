"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isThemeId, THEMES, ThemeId } from "@/lib/themes";

const THEME_STORAGE_KEY = "northstar-theme";

interface ThemeContextValue {
    theme: ThemeId;
    setTheme: (theme: ThemeId) => void;
    themes: typeof THEMES;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: ThemeId) {
    document.documentElement.dataset.theme = theme;
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const background = getComputedStyle(document.documentElement).getPropertyValue("--void").trim();
    if (themeColor && background) themeColor.content = background;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<ThemeId>("nebula");

    useEffect(() => {
        const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
        const nextTheme = isThemeId(storedTheme) ? storedTheme : "nebula";
        setThemeState(nextTheme);
        applyTheme(nextTheme);
    }, []);

    const setTheme = useCallback((nextTheme: ThemeId) => {
        setThemeState(nextTheme);
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        applyTheme(nextTheme);
    }, []);

    const value = useMemo(() => ({ theme, setTheme, themes: THEMES }), [theme, setTheme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used inside ThemeProvider");
    return context;
}
