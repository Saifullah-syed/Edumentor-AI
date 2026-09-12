-- ==========================================================
-- EDUMENTOR AI: Relational Database Schema
-- Compatible with PostgreSQL and SQLite
-- ==========================================================

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'student', -- 'student' or 'admin'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. CAREERS
CREATE TABLE IF NOT EXISTS careers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title VARCHAR(150) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  industry VARCHAR(100) NOT NULL,
  average_salary VARCHAR(50),
  outlook VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. STUDENT PROFILES
CREATE TABLE IF NOT EXISTS student_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  university VARCHAR(150) NOT NULL,
  program VARCHAR(150) NOT NULL,
  degree VARCHAR(100) NOT NULL,
  graduation_year INTEGER DEFAULT 2026,
  gpa REAL DEFAULT 3.6,
  academic_progress REAL DEFAULT 68.0,
  target_career_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (target_career_id) REFERENCES careers(id) ON DELETE SET NULL
);

-- 4. COURSES
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  credits INTEGER NOT NULL DEFAULT 3,
  department VARCHAR(100) NOT NULL,
  difficulty_level VARCHAR(30) DEFAULT 'Intermediate', -- 'Beginner', 'Intermediate', 'Advanced'
  semester_offered VARCHAR(50) DEFAULT 'Fall & Spring',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. STUDENT COURSES
CREATE TABLE IF NOT EXISTS student_courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  grade VARCHAR(5) DEFAULT 'A',
  status VARCHAR(20) NOT NULL DEFAULT 'completed', -- 'completed', 'in_progress', 'planned'
  semester_taken VARCHAR(50) DEFAULT 'Fall 2025',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE(student_id, course_id)
);

-- 6. SKILLS
CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL DEFAULT 'Technical', -- 'Technical', 'Analytical', 'Tool', 'Soft Skill'
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. STUDENT SKILLS
CREATE TABLE IF NOT EXISTS student_skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  skill_id INTEGER NOT NULL,
  proficiency VARCHAR(20) NOT NULL DEFAULT 'Beginner', -- 'Beginner', 'Intermediate', 'Advanced'
  verified INTEGER DEFAULT 0, -- 0 or 1
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
  UNIQUE(student_id, skill_id)
);

-- 8. CAREER SKILLS (Requirements Benchmark)
CREATE TABLE IF NOT EXISTS career_skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  career_id INTEGER NOT NULL,
  skill_id INTEGER NOT NULL,
  required_proficiency VARCHAR(20) NOT NULL DEFAULT 'Intermediate', -- 'Beginner', 'Intermediate', 'Advanced'
  importance VARCHAR(20) NOT NULL DEFAULT 'critical', -- 'critical', 'recommended', 'optional'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
  UNIQUE(career_id, skill_id)
);

-- 9. CAREER ROADMAPS
CREATE TABLE IF NOT EXISTS career_roadmaps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  career_id INTEGER NOT NULL,
  title VARCHAR(150) NOT NULL,
  summary TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE CASCADE
);

-- 10. ROADMAP ITEMS
CREATE TABLE IF NOT EXISTS roadmap_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  roadmap_id INTEGER NOT NULL,
  step_number INTEGER NOT NULL,
  skill_or_topic VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  resources TEXT,
  difficulty VARCHAR(20) DEFAULT 'Intermediate', -- 'Beginner', 'Intermediate', 'Advanced'
  completed INTEGER DEFAULT 0, -- 0 or 1
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (roadmap_id) REFERENCES career_roadmaps(id) ON DELETE CASCADE
);

-- 11. PERSONALIZED LEARNING PLANS
CREATE TABLE IF NOT EXISTS learning_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  title VARCHAR(150) NOT NULL,
  target_career VARCHAR(100) NOT NULL,
  timeframe_weeks INTEGER NOT NULL DEFAULT 8,
  hours_per_week INTEGER NOT NULL DEFAULT 10,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE
);

-- 12. LEARNING PLAN ITEMS
CREATE TABLE IF NOT EXISTS learning_plan_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  topic VARCHAR(150) NOT NULL,
  objective TEXT NOT NULL,
  tasks_json TEXT NOT NULL, -- JSON string array of tasks
  resources TEXT,
  completed INTEGER DEFAULT 0, -- 0 or 1
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES learning_plans(id) ON DELETE CASCADE
);

-- 13. AI CONVERSATIONS
CREATE TABLE IF NOT EXISTS ai_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  title VARCHAR(200) NOT NULL DEFAULT 'Academic Advising Session',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE
);

-- 14. AI MESSAGES
CREATE TABLE IF NOT EXISTS ai_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  sender VARCHAR(10) NOT NULL, -- 'user' or 'ai'
  content TEXT NOT NULL,
  disclaimer_shown INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
);

-- 15. RESUME ANALYSES
CREATE TABLE IF NOT EXISTS resume_analyses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  filename VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  overall_score INTEGER NOT NULL, -- 0 to 100
  career_alignment_score INTEGER NOT NULL, -- 0 to 100
  summary TEXT NOT NULL,
  strengths_json TEXT NOT NULL, -- JSON array
  weaknesses_json TEXT NOT NULL, -- JSON array
  missing_skills_json TEXT NOT NULL, -- JSON array
  recommendations_json TEXT NOT NULL, -- JSON array
  recommended_projects_json TEXT NOT NULL, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_student_profiles_user ON student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_courses_student ON student_courses(student_id);
CREATE INDEX IF NOT EXISTS idx_student_skills_student ON student_skills(student_id);
CREATE INDEX IF NOT EXISTS idx_career_skills_career ON career_skills(career_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_roadmap ON roadmap_items(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_learning_plan_items_plan ON learning_plan_items(plan_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON ai_messages(conversation_id);
