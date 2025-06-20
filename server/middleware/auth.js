// Mock authentication middleware
export const authMiddleware = (req, res, next) => {
  // In a real application, you would validate JWT tokens here
  // For this demo, we'll use mock users
  const mockUsers = {
    'admin': { id: 'admin', username: 'reliefAdmin', role: 'admin' },
    'contributor': { id: 'contributor', username: 'netrunnerX', role: 'contributor' },
    'viewer': { id: 'viewer', username: 'citizen1', role: 'viewer' }
  };
  
  // Get user from header or use default
  const userId = req.headers['x-user-id'] || 'contributor';
  const user = mockUsers[userId] || mockUsers['contributor'];
  
  req.user = user;
  next();
};

export const requireRole = (requiredRole) => {
  return (req, res, next) => {
    const roleHierarchy = { 'viewer': 1, 'contributor': 2, 'admin': 3 };
    const userLevel = roleHierarchy[req.user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 999;
    
    if (userLevel < requiredLevel) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};