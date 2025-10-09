# Sentry Error Tracking Setup

This guide will help you set up Sentry error tracking for the UnifiedHQ dashboard.

## 1. Create a Sentry Account

1. Go to [sentry.io](https://sentry.io) and create an account
2. Create a new project for your Next.js application
3. Select "Next.js" as the platform

## 2. Get Your Sentry Configuration

After creating your project, you'll need:

- **DSN**: Found in Project Settings > Client Keys (DSN)
- **Organization**: Your Sentry organization slug
- **Project**: Your Sentry project slug

## 3. Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project
NEXT_PUBLIC_SENTRY_RELEASE=1.0.0
```

## 4. Features Included

### Error Tracking
- Automatic error capture and reporting
- User context and session tracking
- Component-level error boundaries
- Custom error context and metadata

### Performance Monitoring
- Page load times
- API response times
- Component render times
- Database query performance

### Session Replay
- User session recordings (when errors occur)
- Privacy-focused (text and media masked)
- Helps debug user experience issues

### Enhanced Error Boundaries
- Context-aware error messages
- Auto-retry functionality
- User-friendly error UI
- Suggested recovery actions

## 5. Error Context System

The application includes a sophisticated error context system that provides:

- **Component Identification**: Know which component failed
- **Feature Context**: Understand which feature was affected
- **User Actions**: Track what the user was trying to do
- **Retry Logic**: Automatic retry with exponential backoff
- **Custom Messages**: Context-specific error messages

## 6. Error Recovery

### Auto-Retry
- Network errors: Up to 3 retries with exponential backoff
- GitHub integration: Up to 2 retries with 2-second delay
- Activity feed: Up to 3 retries with 3-second delay
- Authentication: No auto-retry (requires user action)

### User Actions
- Context-aware suggested actions
- Direct links to relevant pages
- One-click recovery options
- Fallback to cached data when available

## 7. Privacy & Security

- Sensitive data is automatically filtered
- User emails are removed from error reports
- Session replays mask text and media
- Error context is sanitized before sending

## 8. Development vs Production

### Development
- All errors are logged to console
- Debug mode enabled
- 100% error sampling rate
- Detailed error information

### Production
- Errors sent to Sentry
- 10% performance sampling
- 10% session replay sampling
- 100% error sampling
- Filtered sensitive data

## 9. Monitoring Dashboard

Once set up, you can monitor:

- Error frequency and trends
- User impact and affected features
- Performance bottlenecks
- User session recordings
- Custom error metrics

## 10. Customization

You can customize error handling by:

- Modifying error context in `src/lib/error-context.ts`
- Adding new error fallback components
- Adjusting retry logic and delays
- Customizing Sentry configuration

## Troubleshooting

### Common Issues

1. **DSN not working**: Check that `NEXT_PUBLIC_SENTRY_DSN` is correctly set
2. **No errors appearing**: Verify your Sentry project is active
3. **Too many errors**: Adjust sampling rates in Sentry config
4. **Missing context**: Ensure error boundaries are properly configured

### Debug Mode

Enable debug mode by setting:
```bash
NODE_ENV=development
```

This will show detailed error information in the console.

## Support

For issues with Sentry integration, check:
- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Error Boundaries Guide](https://docs.sentry.io/platforms/javascript/guides/react/errorboundary/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
