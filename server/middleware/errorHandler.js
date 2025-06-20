export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Log structured error
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    user: req.user?.username || 'anonymous',
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  };
  
  console.error('Structured Error Log:', JSON.stringify(errorLog, null, 2));
  
  // Send appropriate response
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    error: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};