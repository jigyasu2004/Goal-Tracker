export const THEMES = [
    {
        id: "nebula",
        name: "Nebula",
        description: "The original cyan and violet command center.",
        colors: ["#5eead4", "#60a5fa", "#a78bfa"],
    },
    {
        id: "solar",
        name: "Solar Flare",
        description: "Warm amber signals over a deep navy horizon.",
        colors: ["#fbbf24", "#fb7185", "#f97316"],
    },
    {
        id: "matrix",
        name: "Cyber Mint",
        description: "Electric green telemetry with crisp aqua light.",
        colors: ["#4ade80", "#2dd4bf", "#a3e635"],
    },
    {
        id: "quantum",
        name: "Quantum Rose",
        description: "Magenta, rose, and blue for a vivid night shift.",
        colors: ["#f472b6", "#c084fc", "#60a5fa"],
    },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export function isThemeId(value: unknown): value is ThemeId {
    return THEMES.some((theme) => theme.id === value);
}
