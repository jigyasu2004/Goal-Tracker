import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.jigyasu.northstar",
  appName: "Northstar",
  webDir: "mobile-shell",
  server: {
    url: "https://goal-tracker-cyan.vercel.app",
    cleartext: false,
    androidScheme: "https",
    allowNavigation: ["goal-tracker-cyan.vercel.app"],
  },
  android: {
    backgroundColor: "#060915",
    allowMixedContent: false,
  },
};

export default config;
