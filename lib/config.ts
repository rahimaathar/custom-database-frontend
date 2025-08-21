// Configuration for the application
export const config = {
    // Backend URL - defaults to localhost for development
    backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:8080',

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
    return config.backendUrl;
}

// Helper function to check if we're in production
export function isProduction(): boolean {
    return config.isProduction;
}
