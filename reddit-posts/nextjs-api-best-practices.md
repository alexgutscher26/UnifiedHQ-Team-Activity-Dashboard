# Next.js API Authentication Patterns - What I Learned Building Team Activity Endpoints

## The Challenge
When building API endpoints for our team activity dashboard, I ran into authentication issues. The `getCurrentUser()` function wasn't working in API routes because it uses `await headers()` which is only available in server components.

## The Solution
I discovered the proper pattern for API route authentication:

```typescript
// ❌ WRONG - This doesn't work in API routes
import { getCurrentUser } from '@/lib/get-user';
const user = await getCurrentUser();

// ✅ CORRECT - Use auth.api.getSession() directly
import { auth } from '@/lib/auth';

const session = await auth.api.getSession({
  headers: request.headers,
});

if (!session?.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const user = {
  id: session.user.id,
  name: session.user.name,
  email: session.user.email,
  image: session.user.image,
};
```

## Key Differences
- **Server Components**: Can use `await headers()` and `getCurrentUser()`
- **API Routes**: Must use `auth.api.getSession()` with request headers
- **Authentication**: Always check for session existence before proceeding

## Error Handling Pattern
I also implemented a pattern for graceful error handling:

```typescript
try {
  const githubActivities = await fetchGithubActivity(user.id);
  return NextResponse.json({ data: githubActivities });
} catch (githubError) {
  // Handle specific error cases gracefully
  if (githubError.message.includes('GitHub not connected')) {
    return NextResponse.json({
      data: [],
      success: true,
      message: 'GitHub account not connected. Please connect your GitHub account.',
    });
  }
  // ... other error cases
}
```

## Discussion
What authentication patterns do you use in your Next.js API routes? Have you run into similar issues with server component functions in API routes? How do you handle integration dependencies gracefully?

**Target Subreddits**: r/nextjs, r/webdev, r/programming
