import { verifyToken } from '../utils/jwt.js';
import { query } from '../db/index.js';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token missing. Please log in to continue.',
    });
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session. Please log in again.',
    });
  }

  try {
    // Fetch user and profile
    const userRes = await query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Account associated with token no longer exists.',
      });
    }

    const user = userRes.rows[0];

    // If student, attach studentProfileId
    let studentProfileId = null;
    if (user.role === 'student') {
      const profileRes = await query(
        'SELECT id FROM student_profiles WHERE user_id = $1',
        [user.id]
      );
      if (profileRes.rows.length > 0) {
        studentProfileId = profileRes.rows[0].id;
      }
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentProfileId,
    };

    next();
  } catch (err) {
    console.error('[Auth Middleware Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication verification.',
    });
  }
}
