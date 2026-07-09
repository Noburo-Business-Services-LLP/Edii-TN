import User from '../models/User.js';
import ApiError, { asyncHandler } from '../utils/ApiError.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/token.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, 'name, email and password are required');
  }
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new ApiError(409, 'Email already registered');

  const user = new User({ name, email, role: 'student' });
  await user.setPassword(password);
  await user.save();

  res.status(201).json({
    user,
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() });
  if (!user || !(await user.verifyPassword(password || ''))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  res.json({
    user,
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new ApiError(400, 'refreshToken required');
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Invalid refresh token');
  }
  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, 'User no longer exists');
  res.json({ accessToken: signAccessToken(user) });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});
