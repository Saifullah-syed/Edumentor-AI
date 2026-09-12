import { query } from '../db/index.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';

// Basic email format validator
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function register(req, res) {
  try {
    const { name, email, password, university, program, degree } = req.body;

    // Required fields check
    if (!name || !email || !password || !university || !program || !degree) {
      return res.status(400).json({
        success: false,
        message: 'All fields (Name, Email, Password, University, Program, Degree) are required.',
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Email format validation
    if (!isValidEmail(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address format (e.g., student@university.edu).',
      });
    }

    // Password strength check
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Duplicate email check
    const existing = await query('SELECT id FROM users WHERE email = $1', [trimmedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address is already registered. Please log in.',
      });
    }

    // Hash password & create user
    const passwordHash = await hashPassword(password);
    const userRes = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'student') RETURNING id, name, email, role, created_at`,
      [name.trim(), trimmedEmail, passwordHash]
    );
    const newUser = userRes.rows[0];

    // Find a default career to link (e.g. Data Scientist or first career)
    const careerRes = await query('SELECT id FROM careers LIMIT 1');
    const defaultCareerId = careerRes.rows.length > 0 ? careerRes.rows[0].id : null;

    // Create student profile
    const profileRes = await query(
      `INSERT INTO student_profiles (user_id, university, program, degree, graduation_year, gpa, academic_progress, target_career_id)
       VALUES ($1, $2, $3, $4, 2026, 3.5, 45.0, $5) RETURNING id, university, program, degree, gpa, academic_progress`,
      [newUser.id, university.trim(), program.trim(), degree.trim(), defaultCareerId]
    );
    const newProfile = profileRes.rows[0];

    // Generate JWT
    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to EduMentor AI.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        studentProfileId: newProfile.id,
        profile: newProfile,
      },
    });
  } catch (err) {
    console.error('[Register Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create account due to an unexpected server error.',
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Look up user
    const userRes = await query(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
      [trimmedEmail]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your email and password.',
      });
    }

    const user = userRes.rows[0];

    // Check password
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your email and password.',
      });
    }

    // Load profile if student
    let profile = null;
    let studentProfileId = null;
    if (user.role === 'student') {
      const pRes = await query(
        `SELECT sp.*, c.title as target_career_title 
         FROM student_profiles sp 
         LEFT JOIN careers c ON sp.target_career_id = c.id 
         WHERE sp.user_id = $1`,
        [user.id]
      );
      if (pRes.rows.length > 0) {
        profile = pRes.rows[0];
        studentProfileId = profile.id;
      }
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentProfileId,
        profile,
      },
    });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to authenticate user due to an unexpected server error.',
    });
  }
}

export async function getCurrentUser(req, res) {
  try {
    const userRes = await query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = userRes.rows[0];
    let profile = null;

    if (user.role === 'student') {
      const pRes = await query(
        `SELECT sp.*, c.title as target_career_title 
         FROM student_profiles sp 
         LEFT JOIN careers c ON sp.target_career_id = c.id 
         WHERE sp.user_id = $1`,
        [user.id]
      );
      if (pRes.rows.length > 0) {
        profile = pRes.rows[0];
      }
    }

    return res.status(200).json({
      success: true,
      user: {
        ...user,
        studentProfileId: req.user.studentProfileId,
        profile,
      },
    });
  } catch (err) {
    console.error('[Get Current User Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load user profile.',
    });
  }
}
