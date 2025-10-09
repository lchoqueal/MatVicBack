const pool = require('../config/db');

async function adminMiddleware(req, res, next) {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const { rows } = await pool.query('SELECT * FROM administrador WHERE id_usuario_admin = $1', [userId]);
    if (!rows || rows.length === 0) return res.status(403).json({ error: 'Admin privileges required' });
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = adminMiddleware;
