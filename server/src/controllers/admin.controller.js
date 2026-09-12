import { query } from '../db/index.js';

// 1. System Overview Analytics
export async function getAdminStats(req, res) {
  try {
    // Total students count
    const studentCountRes = await query("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
    const totalStudents = parseInt(studentCountRes.rows[0]?.count || 0, 10);

    // Average academic progress & GPA
    const avgProgressRes = await query(
      'SELECT AVG(academic_progress) as avg_progress, AVG(gpa) as avg_gpa FROM student_profiles'
    );
    const avgProgress = Math.round((avgProgressRes.rows[0]?.avg_progress || 0) * 10) / 10;
    const avgGpa = Math.round((avgProgressRes.rows[0]?.avg_gpa || 0) * 100) / 100;

    // Target Careers Distribution
    const careersDistRes = await query(
      `SELECT c.title, COUNT(sp.id) as student_count
       FROM careers c
       LEFT JOIN student_profiles sp ON sp.target_career_id = c.id
       GROUP BY c.id, c.title
       ORDER BY student_count DESC`
    );

    // Most common skill gaps across all students
    const commonGapsRes = await query(
      `SELECT s.name as skill_name, s.category,
              COUNT(sp.id) as total_students_requiring,
              SUM(CASE WHEN ss.id IS NULL OR ss.proficiency = 'Beginner' THEN 1 ELSE 0 END) as students_needing_improvement
       FROM career_skills cs
       JOIN skills s ON cs.skill_id = s.id
       JOIN student_profiles sp ON sp.target_career_id = cs.career_id
       LEFT JOIN student_skills ss ON ss.student_id = sp.id AND ss.skill_id = s.id
       GROUP BY s.id, s.name, s.category
       ORDER BY students_needing_improvement DESC
       LIMIT 6`
    );

    // Total Courses & Skills
    const totalCoursesRes = await query('SELECT COUNT(*) as count FROM courses');
    const totalCareersRes = await query('SELECT COUNT(*) as count FROM careers');

    return res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        avgProgress,
        avgGpa,
        totalCourses: parseInt(totalCoursesRes.rows[0]?.count || 0, 10),
        totalCareers: parseInt(totalCareersRes.rows[0]?.count || 0, 10),
        careerDistribution: careersDistRes.rows,
        commonSkillGaps: commonGapsRes.rows,
      },
    });
  } catch (err) {
    console.error('[Admin getAdminStats Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve administrative analytics.' });
  }
}

// 2. Student Roster with Filtering & Search
export async function getStudents(req, res) {
  try {
    const { search, program } = req.query;

    let sql = `
      SELECT sp.id as profile_id, u.id as user_id, u.name, u.email, u.created_at,
             sp.university, sp.program, sp.degree, sp.graduation_year, sp.gpa, sp.academic_progress,
             c.title as target_career_title
      FROM student_profiles sp
      JOIN users u ON sp.user_id = u.id
      LEFT JOIN careers c ON sp.target_career_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(u.name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length})`;
    }

    if (program && program.trim()) {
      params.push(`%${program.trim().toLowerCase()}%`);
      sql += ` AND LOWER(sp.program) LIKE $${params.length}`;
    }

    sql += ' ORDER BY u.name ASC';

    const studentsRes = await query(sql, params);

    return res.status(200).json({
      success: true,
      students: studentsRes.rows,
      count: studentsRes.rows.length,
    });
  } catch (err) {
    console.error('[Admin getStudents Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve student roster.' });
  }
}

// 3. Inspect Single Student Profile
export async function getStudentDetail(req, res) {
  try {
    const { id } = req.params; // student_profile id

    const studentRes = await query(
      `SELECT sp.*, u.name, u.email, u.created_at as joined_at,
              c.title as target_career_title, c.industry as target_career_industry
       FROM student_profiles sp
       JOIN users u ON sp.user_id = u.id
       LEFT JOIN careers c ON sp.target_career_id = c.id
       WHERE sp.id = $1`,
      [id]
    );

    if (studentRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const student = studentRes.rows[0];

    // Courses
    const coursesRes = await query(
      `SELECT sc.*, c.code, c.title, c.credits, c.department
       FROM student_courses sc
       JOIN courses c ON sc.course_id = c.id
       WHERE sc.student_id = $1
       ORDER BY sc.created_at ASC`,
      [id]
    );

    // Skills
    const skillsRes = await query(
      `SELECT ss.*, s.name, s.category
       FROM student_skills ss
       JOIN skills s ON ss.skill_id = s.id
       WHERE ss.student_id = $1
       ORDER BY s.name ASC`,
      [id]
    );

    // Active Roadmap
    const roadmapRes = await query(
      `SELECT cr.*, 
        COUNT(ri.id) as total_steps,
        COALESCE(SUM(CASE WHEN ri.completed = 1 THEN 1 ELSE 0 END), 0) as completed_steps
       FROM career_roadmaps cr
       LEFT JOIN roadmap_items ri ON cr.id = ri.roadmap_id
       WHERE cr.student_id = $1
       GROUP BY cr.id`,
      [id]
    );

    return res.status(200).json({
      success: true,
      student: {
        ...student,
        courses: coursesRes.rows,
        skills: skillsRes.rows,
        roadmap: roadmapRes.rows[0] || null,
      },
    });
  } catch (err) {
    console.error('[Admin getStudentDetail Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve student details.' });
  }
}

// 4. Course Management (CRUD)
export async function createCourse(req, res) {
  try {
    const { code, title, credits, department, difficulty_level, semester_offered, description } = req.body;

    if (!code || !title || !department) {
      return res.status(400).json({ success: false, message: 'Course code, title, and department are required.' });
    }

    const existing = await query('SELECT id FROM courses WHERE LOWER(code) = LOWER($1)', [code.trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: `Course with code '${code}' already exists.` });
    }

    const newCourseRes = await query(
      `INSERT INTO courses (code, title, credits, department, difficulty_level, semester_offered, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        code.trim().toUpperCase(),
        title.trim(),
        parseInt(credits || 3, 10),
        department.trim(),
        difficulty_level || 'Intermediate',
        semester_offered || 'Fall & Spring',
        description || '',
      ]
    );

    return res.status(201).json({ success: true, message: 'Course added to catalog.', course: newCourseRes.rows[0] });
  } catch (err) {
    console.error('[Admin createCourse Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to create course.' });
  }
}

export async function updateCourse(req, res) {
  try {
    const { id } = req.params;
    const { code, title, credits, department, difficulty_level, semester_offered, description } = req.body;

    await query(
      `UPDATE courses
       SET code = COALESCE($1, code),
           title = COALESCE($2, title),
           credits = COALESCE($3, credits),
           department = COALESCE($4, department),
           difficulty_level = COALESCE($5, difficulty_level),
           semester_offered = COALESCE($6, semester_offered),
           description = COALESCE($7, description)
       WHERE id = $8`,
      [code, title, credits, department, difficulty_level, semester_offered, description, id]
    );

    return res.status(200).json({ success: true, message: 'Course updated successfully.' });
  } catch (err) {
    console.error('[Admin updateCourse Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to update course.' });
  }
}

export async function deleteCourse(req, res) {
  try {
    const { id } = req.params;
    await query('DELETE FROM courses WHERE id = $1', [id]);
    return res.status(200).json({ success: true, message: 'Course deleted from catalog.' });
  } catch (err) {
    console.error('[Admin deleteCourse Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to delete course.' });
  }
}

// 5. Career & Skill Benchmark Management (CRUD)
export async function getAdminCareers(req, res) {
  try {
    const careersRes = await query('SELECT * FROM careers ORDER BY title ASC');
    const careersWithSkills = [];

    for (const c of careersRes.rows) {
      const skillsRes = await query(
        `SELECT cs.id as career_skill_id, cs.required_proficiency, cs.importance,
                s.id as skill_id, s.name, s.category
         FROM career_skills cs
         JOIN skills s ON cs.skill_id = s.id
         WHERE cs.career_id = $1
         ORDER BY s.name ASC`,
        [c.id]
      );

      careersWithSkills.push({
        ...c,
        requiredSkills: skillsRes.rows,
      });
    }

    return res.status(200).json({ success: true, careers: careersWithSkills });
  } catch (err) {
    console.error('[Admin getAdminCareers Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve careers.' });
  }
}

export async function createCareer(req, res) {
  try {
    const { title, description, industry, average_salary, outlook } = req.body;

    if (!title || !description || !industry) {
      return res.status(400).json({ success: false, message: 'Title, description, and industry are required.' });
    }

    const newCareerRes = await query(
      `INSERT INTO careers (title, description, industry, average_salary, outlook)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title.trim(), description.trim(), industry.trim(), average_salary || '$100,000/yr', outlook || 'High']
    );

    return res.status(201).json({ success: true, message: 'Career added.', career: newCareerRes.rows[0] });
  } catch (err) {
    console.error('[Admin createCareer Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to create career.' });
  }
}

export async function updateCareer(req, res) {
  try {
    const { id } = req.params;
    const { title, description, industry, average_salary, outlook } = req.body;

    if (!title || !description || !industry) {
      return res.status(400).json({ success: false, message: 'Title, description, and industry are required.' });
    }

    const careerCheck = await query('SELECT id FROM careers WHERE id = $1', [id]);
    if (careerCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Career track not found.' });
    }

    await query(
      `UPDATE careers
       SET title = $1,
           description = $2,
           industry = $3,
           average_salary = COALESCE($4, average_salary),
           outlook = COALESCE($5, outlook)
       WHERE id = $6`,
      [title.trim(), description.trim(), industry.trim(), average_salary || null, outlook || null, id]
    );

    return res.status(200).json({ success: true, message: 'Career track updated successfully.' });
  } catch (err) {
    console.error('[Admin updateCareer Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to update career track.' });
  }
}

export async function deleteCareer(req, res) {
  try {
    const { id } = req.params;

    const careerCheck = await query('SELECT id, title FROM careers WHERE id = $1', [id]);
    if (careerCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Career track not found.' });
    }
    const career = careerCheck.rows[0];

    // Safety check: verify if any students currently target this career
    const dependentStudents = await query(
      `SELECT sp.id, u.name, u.email
       FROM student_profiles sp
       JOIN users u ON sp.user_id = u.id
       WHERE sp.target_career_id = $1`,
      [id]
    );

    if (dependentStudents.rows.length > 0) {
      const studentNames = dependentStudents.rows.slice(0, 3).map(s => s.name).join(', ');
      const extraCount = dependentStudents.rows.length > 3 ? ` and ${dependentStudents.rows.length - 3} others` : '';
      return res.status(409).json({
        success: false,
        message: `Cannot delete career track "${career.title}" because ${dependentStudents.rows.length} active student(s) (${studentNames}${extraCount}) currently have it set as their target career. Please reassign those students first.`,
        activeStudentCount: dependentStudents.rows.length,
      });
    }

    // Cleanly delete requirements and roadmaps before removing career
    await query('DELETE FROM career_skills WHERE career_id = $1', [id]);
    await query('DELETE FROM career_roadmaps WHERE career_id = $1', [id]);
    await query('DELETE FROM careers WHERE id = $1', [id]);

    return res.status(200).json({
      success: true,
      message: `Career pathway "${career.title}" and its associated requirements were deleted successfully.`,
    });
  } catch (err) {
    console.error('[Admin deleteCareer Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to delete career track.' });
  }
}

export async function addCareerSkill(req, res) {
  try {
    const { careerId } = req.params;
    const { skill_id, required_proficiency, importance } = req.body;

    if (!skill_id) {
      return res.status(400).json({ success: false, message: 'Skill ID is required.' });
    }

    const validProficiencies = ['Beginner', 'Intermediate', 'Advanced'];
    const chosenProficiency = required_proficiency || 'Intermediate';
    if (!validProficiencies.includes(chosenProficiency)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid proficiency level. Allowed values: Beginner, Intermediate, Advanced.',
      });
    }

    const validImportances = ['critical', 'recommended', 'optional'];
    const chosenImportance = importance || 'critical';
    if (!validImportances.includes(chosenImportance)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid importance. Allowed values: critical, recommended, optional.',
      });
    }

    // Check duplicate
    const existing = await query(
      'SELECT id FROM career_skills WHERE career_id = $1 AND skill_id = $2',
      [careerId, skill_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'This skill benchmark is already linked to this career.' });
    }

    await query(
      `INSERT INTO career_skills (career_id, skill_id, required_proficiency, importance)
       VALUES ($1, $2, $3, $4)`,
      [careerId, skill_id, chosenProficiency, chosenImportance]
    );

    return res.status(201).json({ success: true, message: 'Skill benchmark added to career.' });
  } catch (err) {
    console.error('[Admin addCareerSkill Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to link skill to career.' });
  }
}

export async function updateCareerSkill(req, res) {
  try {
    const { careerId, skillId } = req.params;
    const { required_proficiency, importance } = req.body;

    const validProficiencies = ['Beginner', 'Intermediate', 'Advanced'];
    if (required_proficiency && !validProficiencies.includes(required_proficiency)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid proficiency level. Allowed values: Beginner, Intermediate, Advanced.',
      });
    }

    const validImportances = ['critical', 'recommended', 'optional'];
    if (importance && !validImportances.includes(importance)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid importance. Allowed values: critical, recommended, optional.',
      });
    }

    const check = await query(
      'SELECT id FROM career_skills WHERE career_id = $1 AND skill_id = $2',
      [careerId, skillId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Skill benchmark not found for this career.' });
    }

    await query(
      `UPDATE career_skills
       SET required_proficiency = COALESCE($1, required_proficiency),
           importance = COALESCE($2, importance)
       WHERE career_id = $3 AND skill_id = $4`,
      [required_proficiency || null, importance || null, careerId, skillId]
    );

    return res.status(200).json({ success: true, message: 'Skill benchmark updated successfully.' });
  } catch (err) {
    console.error('[Admin updateCareerSkill Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to update skill benchmark.' });
  }
}

export async function removeCareerSkill(req, res) {
  try {
    const { careerId, skillId } = req.params;
    await query('DELETE FROM career_skills WHERE career_id = $1 AND skill_id = $2', [careerId, skillId]);
    return res.status(200).json({ success: true, message: 'Skill benchmark removed.' });
  } catch (err) {
    console.error('[Admin removeCareerSkill Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to remove skill benchmark.' });
  }
}
