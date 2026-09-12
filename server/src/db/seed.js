import bcrypt from 'bcryptjs';
import { initDb, query } from './index.js';

export async function runSeed() {
  console.log('🌱 [SEED] Starting EduMentor AI database seeding...');
  await initDb();

  // Hash passwords
  const salt = await bcrypt.genSalt(10);
  const studentPasswordHash = await bcrypt.hash('Student123!', salt);
  const adminPasswordHash = await bcrypt.hash('saifullah@123', salt);

  // 1. Careers
  console.log('Inserting Careers...');
  const careers = [
    {
      title: 'Data Scientist',
      description: 'Leverage statistical analysis, predictive modeling, and machine learning to derive business insights and automate data-driven decisions.',
      industry: 'Data Science & Artificial Intelligence',
      salary: '$125,000 - $160,000/yr',
      outlook: 'Very High (+35% growth)',
    },
    {
      title: 'Full Stack Software Engineer',
      description: 'Architect, develop, and deploy scalable front-end and back-end web applications with modern microservices and cloud backbones.',
      industry: 'Software Engineering',
      salary: '$115,000 - $150,000/yr',
      outlook: 'High (+25% growth)',
    },
    {
      title: 'AI & Machine Learning Engineer',
      description: 'Build, optimize, and deploy cutting-edge deep learning models, LLMs, and computer vision systems in production environments.',
      industry: 'Artificial Intelligence',
      salary: '$140,000 - $185,000/yr',
      outlook: 'Exponential (+40% growth)',
    },
    {
      title: 'Cloud & DevOps Architect',
      description: 'Design highly available cloud infrastructure, CI/CD pipelines, container orchestration, and automated deployment architectures.',
      industry: 'Cloud Infrastructure & Security',
      salary: '$130,000 - $170,000/yr',
      outlook: 'High (+28% growth)',
    },
  ];

  const careerIds = {};
  for (const c of careers) {
    const existing = await query('SELECT id FROM careers WHERE title = $1', [c.title]);
    if (existing.rows.length > 0) {
      careerIds[c.title] = existing.rows[0].id;
    } else {
      const res = await query(
        `INSERT INTO careers (title, description, industry, average_salary, outlook)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [c.title, c.description, c.industry, c.salary, c.outlook]
      );
      careerIds[c.title] = res.rows[0].id;
    }
  }

  // 2. Skills
  console.log('Inserting Skills...');
  const skillsList = [
    { name: 'Python', category: 'Technical', desc: 'Core programming, OOP, data structures, and standard libraries.' },
    { name: 'SQL', category: 'Technical', desc: 'Relational database queries, joins, indexes, window functions, and optimization.' },
    { name: 'Statistics', category: 'Analytical', desc: 'Descriptive, inferential statistics, hypothesis testing, and probability distributions.' },
    { name: 'Machine Learning', category: 'Technical', desc: 'Supervised, unsupervised algorithms, model evaluation, and scikit-learn.' },
    { name: 'Deep Learning', category: 'Technical', desc: 'Neural networks, PyTorch/TensorFlow, CNNs, Transformers, and embeddings.' },
    { name: 'Data Visualization', category: 'Analytical', desc: 'Matplotlib, Seaborn, Tableau, and visual data storytelling.' },
    { name: 'React', category: 'Technical', desc: 'Component architecture, state hooks, virtual DOM, and frontend optimization.' },
    { name: 'Node.js', category: 'Technical', desc: 'Asynchronous event-driven backend development, Express, and REST APIs.' },
    { name: 'TypeScript', category: 'Technical', desc: 'Static typing, generics, interfaces, and compile-time safety.' },
    { name: 'Docker', category: 'Tool', desc: 'Containerization, Dockerfile authoring, and multi-container environments.' },
    { name: 'Git & GitHub', category: 'Tool', desc: 'Branching strategies, pull requests, merge conflict resolution, and CI/CD.' },
    { name: 'System Design', category: 'Analytical', desc: 'Scalability, caching, load balancing, microservices, and CAP theorem.' },
    { name: 'Communication', category: 'Soft Skill', desc: 'Articulating technical concepts clearly to non-technical stakeholders.' },
    { name: 'Problem Solving', category: 'Soft Skill', desc: 'Decomposing complex business challenges into structured technical solutions.' },
  ];

  const skillIds = {};
  for (const s of skillsList) {
    const existing = await query('SELECT id FROM skills WHERE name = $1', [s.name]);
    if (existing.rows.length > 0) {
      skillIds[s.name] = existing.rows[0].id;
    } else {
      const res = await query(
        `INSERT INTO skills (name, category, description)
         VALUES ($1, $2, $3) RETURNING id`,
        [s.name, s.category, s.desc]
      );
      skillIds[s.name] = res.rows[0].id;
    }
  }

  // 3. Career Skills (Benchmark)
  console.log('Mapping Career Skill Requirements...');
  const careerSkillReqs = [
    // Data Scientist
    { career: 'Data Scientist', skill: 'Python', level: 'Advanced', importance: 'critical' },
    { career: 'Data Scientist', skill: 'SQL', level: 'Intermediate', importance: 'critical' },
    { career: 'Data Scientist', skill: 'Statistics', level: 'Advanced', importance: 'critical' },
    { career: 'Data Scientist', skill: 'Machine Learning', level: 'Intermediate', importance: 'critical' },
    { career: 'Data Scientist', skill: 'Deep Learning', level: 'Intermediate', importance: 'recommended' },
    { career: 'Data Scientist', skill: 'Data Visualization', level: 'Intermediate', importance: 'recommended' },
    { career: 'Data Scientist', skill: 'Communication', level: 'Intermediate', importance: 'recommended' },
    // Full Stack
    { career: 'Full Stack Software Engineer', skill: 'React', level: 'Advanced', importance: 'critical' },
    { career: 'Full Stack Software Engineer', skill: 'Node.js', level: 'Advanced', importance: 'critical' },
    { career: 'Full Stack Software Engineer', skill: 'TypeScript', level: 'Intermediate', importance: 'critical' },
    { career: 'Full Stack Software Engineer', skill: 'SQL', level: 'Intermediate', importance: 'critical' },
    { career: 'Full Stack Software Engineer', skill: 'Git & GitHub', level: 'Advanced', importance: 'critical' },
    { career: 'Full Stack Software Engineer', skill: 'Docker', level: 'Intermediate', importance: 'recommended' },
    // AI Engineer
    { career: 'AI & Machine Learning Engineer', skill: 'Python', level: 'Advanced', importance: 'critical' },
    { career: 'AI & Machine Learning Engineer', skill: 'Deep Learning', level: 'Advanced', importance: 'critical' },
    { career: 'AI & Machine Learning Engineer', skill: 'Machine Learning', level: 'Advanced', importance: 'critical' },
    { career: 'AI & Machine Learning Engineer', skill: 'Statistics', level: 'Advanced', importance: 'critical' },
    { career: 'AI & Machine Learning Engineer', skill: 'Docker', level: 'Intermediate', importance: 'recommended' },
  ];

  for (const csr of careerSkillReqs) {
    const cId = careerIds[csr.career];
    const sId = skillIds[csr.skill];
    if (cId && sId) {
      await query(
        `INSERT OR IGNORE INTO career_skills (career_id, skill_id, required_proficiency, importance)
         VALUES ($1, $2, $3, $4)`,
        [cId, sId, csr.level, csr.importance]
      );
    }
  }

  // 4. University Courses
  console.log('Inserting University Courses...');
  const courses = [
    { code: 'CS101', title: 'Programming Fundamentals (Python)', credits: 4, dept: 'Computer Science', level: 'Beginner', sem: 'Fall & Spring', desc: 'Core programming constructs, control flow, functions, OOP, and unit testing.' },
    { code: 'CS201', title: 'Data Structures and Algorithms', credits: 4, dept: 'Computer Science', level: 'Intermediate', sem: 'Fall & Spring', desc: 'Arrays, linked lists, trees, graphs, sorting algorithms, and asymptotic Big-O analysis.' },
    { code: 'CS305', title: 'Database Management Systems', credits: 3, dept: 'Computer Science', level: 'Intermediate', sem: 'Fall & Spring', desc: 'Relational algebra, SQL schema design, normalization, ACID properties, and indexing.' },
    { code: 'MATH220', title: 'Probability & Applied Statistics', credits: 3, dept: 'Mathematics', level: 'Intermediate', sem: 'Fall', desc: 'Random variables, probability distributions, regression, central limit theorem, hypothesis tests.' },
    { code: 'CS410', title: 'Machine Learning Fundamentals', credits: 3, dept: 'Computer Science', level: 'Advanced', sem: 'Spring', desc: 'Supervised and unsupervised models, loss functions, gradient descent, bias-variance tradeoff.' },
    { code: 'CS420', title: 'Web Application Architecture', credits: 3, dept: 'Computer Science', level: 'Intermediate', sem: 'Fall & Spring', desc: 'RESTful API design, front-end SPA development, authentication, and state management.' },
    { code: 'CS430', title: 'Deep Learning & Neural Networks', credits: 3, dept: 'Computer Science', level: 'Advanced', sem: 'Spring', desc: 'Backpropagation, PyTorch, convolutional networks, transformers, and transfer learning.' },
    { code: 'CS490', title: 'Senior Capstone Software Project', credits: 4, dept: 'Computer Science', level: 'Advanced', sem: 'Spring', desc: 'Comprehensive team-based production engineering capstone with stakeholder reviews.' },
  ];

  const courseIds = {};
  for (const crs of courses) {
    const existing = await query('SELECT id FROM courses WHERE code = $1', [crs.code]);
    if (existing.rows.length > 0) {
      courseIds[crs.code] = existing.rows[0].id;
    } else {
      const res = await query(
        `INSERT INTO courses (code, title, credits, department, difficulty_level, semester_offered, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [crs.code, crs.title, crs.credits, crs.dept, crs.level, crs.sem, crs.desc]
      );
      courseIds[crs.code] = res.rows[0].id;
    }
  }

  // 5. Admin User (Saifullah Admin)
  console.log('Inserting Admin User...');
  let adminUser = (await query('SELECT id FROM users WHERE email = $1', ['admin@saifullah.ai'])).rows[0];
  if (!adminUser) {
    const res = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin') RETURNING id`,
      ['Saifullah (Admin)', 'admin@saifullah.ai', adminPasswordHash]
    );
    adminUser = res.rows[0];
  }

  // 6. Primary Demo Student (Saifullah)
  console.log('Inserting Demo Student User (Saifullah)...');
  let alexUser = (await query('SELECT id FROM users WHERE email = $1', ['saifullah@student.edu'])).rows[0];
  if (!alexUser) {
    const res = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'student') RETURNING id`,
      ['Saifullah', 'saifullah@student.edu', studentPasswordHash]
    );
    alexUser = res.rows[0];
  }

  // Alex Profile
  let alexProfile = (await query('SELECT id FROM student_profiles WHERE user_id = $1', [alexUser.id])).rows[0];
  const dataScientistCareerId = careerIds['Data Scientist'];
  if (!alexProfile) {
    const res = await query(
      `INSERT INTO student_profiles (user_id, university, program, degree, graduation_year, gpa, academic_progress, target_career_id)
       VALUES ($1, $2, $3, $4, 2026, 3.65, 68.0, $5) RETURNING id`,
      [alexUser.id, 'State University', 'Computer Science & AI', 'Bachelor of Science', dataScientistCareerId]
    );
    alexProfile = res.rows[0];
  }

  // Alex Courses
  const alexCourses = [
    { code: 'CS101', grade: 'A', status: 'completed', sem: 'Fall 2024' },
    { code: 'CS201', grade: 'A-', status: 'completed', sem: 'Spring 2025' },
    { code: 'CS305', grade: 'B+', status: 'completed', sem: 'Fall 2025' },
    { code: 'MATH220', grade: 'B', status: 'completed', sem: 'Fall 2025' },
    { code: 'CS410', grade: null, status: 'in_progress', sem: 'Spring 2026' },
    { code: 'CS490', grade: null, status: 'planned', sem: 'Fall 2026' },
  ];
  for (const ac of alexCourses) {
    const cId = courseIds[ac.code];
    if (cId) {
      await query(
        `INSERT OR IGNORE INTO student_courses (student_id, course_id, grade, status, semester_taken)
         VALUES ($1, $2, $3, $4, $5)`,
        [alexProfile.id, cId, ac.grade, ac.status, ac.sem]
      );
    }
  }

  // Alex Skills
  const alexSkills = [
    { name: 'Python', level: 'Advanced', verified: 1 },
    { name: 'SQL', level: 'Beginner', verified: 0 },
    { name: 'Statistics', level: 'Beginner', verified: 0 },
    { name: 'Machine Learning', level: 'Beginner', verified: 0 },
    { name: 'Git & GitHub', level: 'Intermediate', verified: 1 },
    { name: 'Problem Solving', level: 'Intermediate', verified: 0 },
  ];
  for (const ask of alexSkills) {
    const sId = skillIds[ask.name];
    if (sId) {
      await query(
        `INSERT OR IGNORE INTO student_skills (student_id, skill_id, proficiency, verified)
         VALUES ($1, $2, $3, $4)`,
        [alexProfile.id, sId, ask.level, ask.verified]
      );
    }
  }

  // Alex Career Roadmap
  const existingRoadmap = (await query('SELECT id FROM career_roadmaps WHERE student_id = $1', [alexProfile.id])).rows[0];
  let roadmapId = existingRoadmap?.id;
  if (!roadmapId) {
    const res = await query(
      `INSERT INTO career_roadmaps (student_id, career_id, title, summary)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [
        alexProfile.id,
        dataScientistCareerId,
        'Data Scientist Career Roadmap',
        'A comprehensive sequence from foundational programming to applied machine learning and entry-level portfolio readiness.',
      ]
    );
    roadmapId = res.rows[0].id;

    const roadmapSteps = [
      { step: 1, topic: 'Python Programming & Scientific Computing', desc: 'Master NumPy, Pandas, object-oriented principles, and memory-efficient data manipulation.', resources: 'Official Python Docs, RealPython, Harvard CS50P', diff: 'Intermediate', comp: 1 },
      { step: 2, topic: 'Relational Databases & Advanced SQL', desc: 'Master subqueries, window functions (ROW_NUMBER, RANK), joins, and query optimization.', resources: 'Mode Analytics SQL Tutorial, LeetCode Database Questions', diff: 'Intermediate', comp: 0 },
      { step: 3, topic: 'Applied Statistics & Probability', desc: 'Master hypothesis testing, p-values, regression analysis, confidence intervals, and ANOVA.', resources: 'Khan Academy Statistics, StatQuest with Josh Starmer', diff: 'Advanced', comp: 0 },
      { step: 4, topic: 'Machine Learning Fundamentals', desc: 'Understand loss functions, gradient descent, regularized regression (Lasso/Ridge), trees, and clustering.', resources: 'Coursera Andrew Ng ML Specialization, Scikit-Learn Docs', diff: 'Intermediate', comp: 0 },
      { step: 5, topic: 'Deep Learning & Neural Networks', desc: 'Explore backpropagation, multi-layer perceptrons, CNNs for vision, and transformer fundamentals using PyTorch.', resources: 'DeepLearning.AI Deep Learning Specialization, fast.ai', diff: 'Advanced', comp: 0 },
      { step: 6, topic: 'End-to-End Production ML Project', desc: 'Deploy an automated predictive model with FastAPI backend, clean frontend dashboard, and containerized Docker.', resources: 'GitHub Open Source Repositories, Streamlit Gallery', diff: 'Advanced', comp: 0 },
      { step: 7, topic: 'Internship & Technical Interview Preparation', desc: 'Practice behavioral STAR stories, technical coding problems, system design reviews, and portfolio presentation.', resources: 'Ace the Data Science Interview, Glassdoor Interview Prep', diff: 'Intermediate', comp: 0 },
    ];

    for (const rs of roadmapSteps) {
      await query(
        `INSERT INTO roadmap_items (roadmap_id, step_number, skill_or_topic, description, resources, difficulty, completed)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [roadmapId, rs.step, rs.topic, rs.desc, rs.resources, rs.diff, rs.comp]
      );
    }
  }

  // Alex Learning Plan
  const existingPlan = (await query('SELECT id FROM learning_plans WHERE student_id = $1', [alexProfile.id])).rows[0];
  if (!existingPlan) {
    const res = await query(
      `INSERT INTO learning_plans (student_id, title, target_career, timeframe_weeks, hours_per_week)
       VALUES ($1, $2, $3, 8, 10) RETURNING id`,
      [alexProfile.id, '8-Week Accelerated Data Science Learning Plan', 'Data Scientist']
    );
    const planId = res.rows[0].id;

    const weeks = [
      {
        week: 1,
        topic: 'Python Review & Advanced Data Structures',
        obj: 'Refresh list comprehensions, generators, NumPy vectorization, and clean code principles.',
        tasks: JSON.stringify(['Solve 10 LeetCode Python problems', 'Build NumPy matrix multiplication exercise', 'Review Python 3.12 type hints']),
        resources: 'Python Documentation, LeetCode Easy-Medium',
        comp: 1,
      },
      {
        week: 2,
        topic: 'SQL Fundamentals & Relational Data Modeling',
        obj: 'Master complex queries, aggregations, GROUP BY, and entity-relationship diagrams.',
        tasks: JSON.stringify(['Complete SQL Bolt interactive tutorials', 'Solve 15 SQL queries on HackerRank', 'Design schema for a university bookstore']),
        resources: 'SQLBolt, PostgreSQL Tutorial',
        comp: 1,
      },
      {
        week: 3,
        topic: 'Descriptive & Inferential Statistics',
        obj: 'Understand standard error, z-scores, hypothesis testing, and p-value interpretations.',
        tasks: JSON.stringify(['Perform two-sample t-test on sample dataset', 'Calculate correlation vs causation benchmarks', 'Watch StatQuest hypothesis series']),
        resources: 'StatQuest, OpenIntro Statistics Chapter 4-5',
        comp: 0,
      },
      {
        week: 4,
        topic: 'Supervised Learning: Regression & Classification',
        obj: 'Implement linear regression, logistic regression, decision trees, and evaluate with ROC-AUC.',
        tasks: JSON.stringify(['Train baseline model on Titanic dataset', 'Compute precision, recall, and F1-score', 'Analyze feature importance weights']),
        resources: 'Scikit-Learn documentation & Kaggle tutorials',
        comp: 0,
      },
      {
        week: 5,
        topic: 'Unsupervised Learning & Feature Engineering',
        obj: 'Explore K-Means clustering, PCA dimensionality reduction, and handling missing data.',
        tasks: JSON.stringify(['Apply PCA on customer segmentation data', 'Impute missing values using KNNImputer', 'Create interactive 2D cluster visualization']),
        resources: 'Hands-On Machine Learning (Aurélien Géron)',
        comp: 0,
      },
      {
        week: 6,
        topic: 'Model Optimization & Cross-Validation',
        obj: 'Prevent overfitting using K-Fold cross-validation, hyperparameter tuning via GridSearchCV.',
        tasks: JSON.stringify(['Set up 5-fold cross validation pipeline', 'Tune XGBoost hyperparameters with Optuna', 'Plot learning curves']),
        resources: 'Cross-Validation best practices guide',
        comp: 0,
      },
      {
        week: 7,
        topic: 'Full-Stack Model Deployment & API Creation',
        obj: 'Package trained model into an Express or FastAPI REST endpoint with input validation.',
        tasks: JSON.stringify(['Export model with joblib', 'Create POST /predict endpoint', 'Test API using Postman and Jest']),
        resources: 'FastAPI / Express Machine Learning serving guide',
        comp: 0,
      },
      {
        week: 8,
        topic: 'Portfolio Documentation & Resume Polishing',
        obj: 'Write an impactful GitHub README with architecture diagrams and record a 2-minute demo.',
        tasks: JSON.stringify(['Document GitHub repository with clean markdown', 'Update resume using EduMentor Resume Analyzer', 'Conduct mock technical interview']),
        resources: 'EduMentor AI Resume Analyzer',
        comp: 0,
      },
    ];

    for (const w of weeks) {
      await query(
        `INSERT INTO learning_plan_items (plan_id, week_number, topic, objective, tasks_json, resources, completed)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [planId, w.week, w.topic, w.obj, w.tasks, w.resources, w.comp]
      );
    }
  }

  // 7. Second Demo Student (Maya Lin) for Admin Roster comparison
  console.log('Inserting Second Demo Student (Maya Lin)...');
  let mayaUser = (await query('SELECT id FROM users WHERE email = $1', ['maya@student.edu'])).rows[0];
  if (!mayaUser) {
    const res = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'student') RETURNING id`,
      ['Maya Lin', 'maya@student.edu', studentPasswordHash]
    );
    mayaUser = res.rows[0];
  }

  const fullStackCareerId = careerIds['Full Stack Software Engineer'];
  let mayaProfile = (await query('SELECT id FROM student_profiles WHERE user_id = $1', [mayaUser.id])).rows[0];
  if (!mayaProfile) {
    const res = await query(
      `INSERT INTO student_profiles (user_id, university, program, degree, graduation_year, gpa, academic_progress, target_career_id)
       VALUES ($1, $2, $3, $4, 2025, 3.82, 84.0, $5) RETURNING id`,
      [mayaUser.id, 'State University', 'Software Engineering', 'Bachelor of Science', fullStackCareerId]
    );
    mayaProfile = res.rows[0];
  }

  // Maya Skills
  const mayaSkills = [
    { name: 'React', level: 'Advanced', verified: 1 },
    { name: 'Node.js', level: 'Intermediate', verified: 1 },
    { name: 'TypeScript', level: 'Intermediate', verified: 1 },
    { name: 'Git & GitHub', level: 'Advanced', verified: 1 },
    { name: 'Docker', level: 'Beginner', verified: 0 },
  ];
  for (const msk of mayaSkills) {
    const sId = skillIds[msk.name];
    if (sId) {
      await query(
        `INSERT OR IGNORE INTO student_skills (student_id, skill_id, proficiency, verified)
         VALUES ($1, $2, $3, $4)`,
        [mayaProfile.id, sId, msk.level, msk.verified]
      );
    }
  }

  console.log('✅ [SEED] Database seeded successfully!');
  console.log('---------------------------------------------------------');
  console.log('ACCOUNTS READY:');
  console.log('  Demo Student: saifullah@student.edu / Student123!');
  console.log('  Admin:        admin@saifullah.ai    / saifullah@123');
  console.log('---------------------------------------------------------');
}

// If run directly via `node src/db/seed.js`
if (process.argv[1] && process.argv[1].includes('seed.js')) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ [SEED FAILED]', err);
      process.exit(1);
    });
}
