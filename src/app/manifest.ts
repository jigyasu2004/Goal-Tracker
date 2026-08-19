import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Northstar Goal Tracker",
        short_name: "Northstar",
        description: "A focused command center for goals, habits, momentum, and reflection.",
        start_url: "/dashboard",
        display: "standalone",
        background_color: "#060712",
        theme_color: "#060712",
        orientation: "portrait-primary",
        categories: ["productivity", "lifestyle"],
        icons: [
            {
                src: "/icon.svg",
                sizes: "any",
                type: "image/svg+xml",
                purpose: "any",
            },
            {
                src: "/icon.svg",
                sizes: "any",
                type: "image/svg+xml",
                purpose: "maskable",
            },
        ],
        shortcuts: [
            {
                name: "Today",
                short_name: "Today",
                description: "Open today's goal workspace",
                url: "/dashboard",
                icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
            },
            {
                name: "Settings",
                short_name: "Settings",
                description: "Change your Northstar settings",
                url: "/settings",
                icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
            },
        ],
    };
}
