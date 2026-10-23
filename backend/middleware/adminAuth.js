export function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token || token !== process.env.DEMO_ADMIN_TOKEN) {
    return res.status(401).json({ message: 'Admin authorization required.' });
  }
  next();
}
