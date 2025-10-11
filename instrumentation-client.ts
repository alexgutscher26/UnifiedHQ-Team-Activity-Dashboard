import posthog from "posthog-js"

// Only initialize PostHog if we have the required environment variables
if (process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    ui_host: "https://us.posthog.com",
    defaults: '2025-05-24',
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
  });
} else {
  console.warn('PostHog environment variables not found. Please check your .env.local file.');
}
