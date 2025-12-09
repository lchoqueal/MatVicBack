const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  console.log('=== AUTH MIDDLEWARE DEBUG ===');
  console.log('Headers:', req.headers);
  
  const authHeader = req.headers.authorization;
  console.log('Authorization header:', authHeader);
  
  if (!authHeader) {
    console.log('❌ No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2) {
    console.log('❌ Token error - parts length:', parts.length);
    return res.status(401).json({ error: 'Token error' });
  }
  
  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme)) {
    console.log('❌ Malformed token - scheme:', scheme);
    return res.status(401).json({ error: 'Malformed token' });
  }
  
  console.log('Token recibido:', token.substring(0, 20) + '...');
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Configurado' : 'NO CONFIGURADO');
  
  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
    if (err) {
      console.log('❌ Invalid token error:', err.message);
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    console.log('✅ Token válido. Usuario ID:', decoded.id);
    req.userId = decoded.id;
    next();
  });
}

module.exports = authMiddleware;

module.exports = authMiddleware;
