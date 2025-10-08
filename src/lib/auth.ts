import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@/generated/prisma";
import { dymoEmailPlugin } from "@dymo-api/better-auth";
import { openAPI } from "better-auth/plugins";

const prisma = new PrismaClient();
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: { 
        enabled: true, 
    }, 
    socialProviders: { 
        github: { 
            clientId: process.env.GITHUB_CLIENT_ID as string, 
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string, 
        }, 
        // slack: { 
        //     clientId: process.env.SLACK_CLIENT_ID as string, 
        //     clientSecret: process.env.SLACK_CLIENT_SECRET as string, 
        // }, 
    },
    plugins: [ 
        dymoEmailPlugin({ 
            apiKey: process.env.DYMO_API_KEY as string,
            applyToLogin: true,  // recommended
            applyToOAuth: true,   // validate OAuth emails
            emailRules: {
                // These are the default rules defined for email validation.
                deny: ["FRAUD", "INVALID", "NO_MX_RECORDS", "NO_REPLY_EMAIL"]
            }
        }),
        openAPI()
    ],
    secret: process.env.BETTER_AUTH_SECRET as string,
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});