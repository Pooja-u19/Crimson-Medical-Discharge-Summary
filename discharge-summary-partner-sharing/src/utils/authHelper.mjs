export const requireAuth = (event) => {
  // For now, return a mock user - authentication can be added later
  return {
    userId: 'user-123',
    email: 'user@example.com'
  };
};