import { createAuthClient } from 'better-auth/react';
import {
  lastLoginMethodClient,
  multiSessionClient,
} from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL:
    process.env.NODE_ENV === 'production'
      ? 'https://your-domain.com'
      : 'http://localhost:3000',
  plugins: [multiSessionClient(), lastLoginMethodClient()],
  fetchOptions: {
    onError: async context => {
      const { response } = context;
      if (response.status === 429) {
        const retryAfter = response.headers.get('X-Retry-After');
        console.warn(`Rate limit exceeded. Retry after ${retryAfter} seconds`);

        // ToDo: You can add custom UI handling here, such as:
        // - Show a toast notification
        // - Display a retry countdown
        // - Redirect to a rate limit page

        // Example: Show alert to user
        if (typeof window !== 'undefined') {
          alert(
            `Too many requests. Please wait ${retryAfter} seconds before trying again.`
          );
        }
      }
    },
  },
});
