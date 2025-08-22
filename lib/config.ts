// Configuration for the application
export const config = {
    // Backend URL - defaults to Render backend for production
    backendUrl: (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'https://custom-database-backend.onrender.com').replace(/\/+$/, ''),

    // API timeout in milliseconds
    apiTimeout: 10000,

    // Environment
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',

    // CORS settings
    cors: {
        origin: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
        credentials: true
    }
};

// Helper function to get backend URL
export function getBackendUrl(): string {
    return config.backendUrl.replace(/\/+$/, '');
}

// Helper function to construct API URL
export function getApiUrl(endpoint: string): string {
    const baseUrl = getBackendUrl();
    const cleanEndpoint = endpoint.replace(/^\/+/, ''); // Remove leading slashes
    return `${baseUrl}/${cleanEndpoint}`;
}

// Helper function to check if we're in production
export function isProduction(): boolean {
    return config.isProduction;
}
