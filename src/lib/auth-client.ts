import { createAuthClient } from "better-auth/client";
import { lastLoginMethodClient, multiSessionClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: process.env.NODE_ENV === "production" 
        ? "https://your-domain.com" 
        : "http://localhost:3000",
    plugins: [
        multiSessionClient(),
        lastLoginMethodClient() 
    ]
});