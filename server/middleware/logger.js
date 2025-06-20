export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      user: req.user?.username || 'anonymous',
      ip: req.ip
    };
    
    console.log('Request Log:', JSON.stringify(logData));
  });
  
  next();
};