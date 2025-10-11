export function register() {
  // No-op for initialization
}

export const onRequestError = async (err: Error, request: Request, context: any) => {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { captureServerException } = await import('./src/lib/posthog-server');
      
      let distinctId: string | undefined;
      
      // Extract distinct_id from PostHog cookie
      if (request.headers.get('cookie')) {
        const cookieString = request.headers.get('cookie')!;
        const postHogCookieMatch = cookieString.match(/ph_phc_.*?_posthog=([^;]+)/);
        
        if (postHogCookieMatch && postHogCookieMatch[1]) {
          try {
            const decodedCookie = decodeURIComponent(postHogCookieMatch[1]);
            const postHogData = JSON.parse(decodedCookie);
            distinctId = postHogData.distinct_id;
          } catch (e) {
            console.error('Error parsing PostHog cookie:', e);
          }
        }
      }
      
      // Capture the server-side error (only if PostHog is properly configured)
      await captureServerException(err, distinctId, {
        url: request.url,
        method: request.method,
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to capture server error:', error);
    }
  }
};
