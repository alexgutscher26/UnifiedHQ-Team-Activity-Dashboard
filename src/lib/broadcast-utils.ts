// Helper function to broadcast repository changes
export function broadcastRepositoryChange(
  userId: string,
  action: 'added' | 'removed',
  repoName: string
) {
  if (global.userConnections?.has(userId)) {
    const controller = global.userConnections.get(userId);
    try {
      const message = JSON.stringify({
        type: 'repository_update',
        data: {
          action,
          repoName,
          message: `Repository ${repoName} ${action}`,
        },
        timestamp: new Date().toISOString(),
      });
      controller.enqueue(`data: ${message}\n\n`);
    } catch (error) {
      console.error('Failed to broadcast repository change:', error);
      global.userConnections?.delete(userId);
    }
  }
}
