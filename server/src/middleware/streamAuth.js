import { verifyAccessToken } from '../utils/token.js';
import ApiError from '../utils/ApiError.js';
import User from '../models/User.js';

// Like requireAuth, but also accepts the token via ?token= query param,
// because a <video src> element cannot send an Authorization header.
export async function streamAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ')
      ? header.slice(7)
      : req.query.token || null;
    if (!token) throw new ApiError(401, 'Authentication required');

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user) throw new ApiError(401, 'User no longer exists');
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(new ApiError(401, 'Token expired'));
    if (err.name === 'JsonWebTokenError') return next(new ApiError(401, 'Invalid token'));
    next(err);
  }
}
