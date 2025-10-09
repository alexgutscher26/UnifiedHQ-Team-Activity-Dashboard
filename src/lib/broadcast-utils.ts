// Helper function to broadcast repository changes
/**
 * Broadcasts a change in a repository to the connected user.
 *
 * This function checks if the user identified by userId has an active connection. If so, it constructs a message
 * containing the action (either 'added' or 'removed') and the repository name, then enqueues this message for
 * broadcasting. In case of an error during message creation or broadcasting, it logs the error and removes the
 * user's connection from the global userConnections.
 *
 * @param {string} userId - The ID of the user to whom the repository change is being broadcasted.
 * @param {'added' | 'removed'} action - The action indicating whether a repository was added or removed.
 * @param {string} repoName - The name of the repository that was changed.
 */
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
