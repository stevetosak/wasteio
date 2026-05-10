type EnvConfig = {
    API_URL: string;
};

declare global {
    interface Window {
        __CONFIG__?: EnvConfig;
    }
}

const mode = import.meta.env.MODE;

const loadEnvConfig = (): EnvConfig => {
    if (mode === "development") {
        const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
        if (!apiUrl) throw new Error("Missing VITE_API_URL for development");
        return { API_URL: apiUrl };
    }

    if (mode === "production") {
        const config = window.__CONFIG__;
        if (!config) throw new Error("Production runtime config (window.__CONFIG__) not loaded");
        return config;
    }

    throw new Error(`Unsupported mode: ${mode}`);
};

export const envConfig = loadEnvConfig();
