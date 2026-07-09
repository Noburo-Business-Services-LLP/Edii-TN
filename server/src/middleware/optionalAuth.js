import { verifyAccessToken } from '../utils/token.js';
import User from '../models/User.js';

// Attaches req.user if a valid token is present, but never rejects the request.
export async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (token) {
      const payload = verifyAccessToken(token);
      req.user = await User.findById(payload.sub);
    }
  } catch {
    // ignore invalid/expired token for optional routes
  }
  next();
}
