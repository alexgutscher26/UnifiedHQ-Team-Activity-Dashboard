import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
    baseURL: process.env.NODE_ENV === "production" 
        ? "https://your-domain.com" 
        : "http://localhost:3000",
});