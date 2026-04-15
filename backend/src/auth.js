import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'local-dev-secret';

export function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email, fullName: user.full_name },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing authorization token.' });
  }

  try {
    const token = header.replace('Bearer ', '');
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

export function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You are not allowed to perform this action.' });
    }
    return next();
  };
}
