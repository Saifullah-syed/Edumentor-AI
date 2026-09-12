import { query } from '../db/index.js';

// Helper to get student profile for authenticated user
async function getStudentProfileId(userId) {
  const res = await query('SELECT id FROM student_profiles WHERE user_id = $1', [userId]);
  return res.rows[0]?.id || null;
}

// 1. Get Student Profile & Academics
export async function getProfile(req, res) {
  try {
    const studentProfileId = await getStudentProfileId(req.user.id);
    if (!studentProfileId) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const profileRes = await query(
      `SELECT sp.*, u.name, u.email, c.title as target_career_title, c.industry as target_career_industry
       FROM student_profiles sp
       JOIN users u ON sp.user_id = u.id
       LEFT JOIN careers c ON sp.target_career_id = c.id
       WHERE sp.id = $1`,
      [studentProfileId]
    );

    const profile = profileRes.rows[0];

    // Fetch courses
    const coursesRes = await query(
      `SELECT sc.id, sc.course_id, sc.grade, sc.status, sc.semester_taken,
              c.code, c.title, c.credits, c.department, c.difficulty_level
       FROM student_courses sc
       JOIN courses c ON sc.course_id = c.id
       WHERE sc.student_id = $1
       ORDER BY sc.created_at ASC`,
      [studentProfileId]
    );

    // Fetch skills
    const skillsRes = await query(
      `SELECT ss.id, ss.skill_id, ss.proficiency, ss.verified,
              s.name, s.category, s.description
       FROM student_skills ss
       JOIN skills s ON ss.skill_id = s.id
       WHERE ss.student_id = $1
       ORDER BY s.name ASC`,
      [studentProfileId]
    );

    return res.status(200).json({
      success: true,
      profile: {
        ...profile,
        courses: coursesRes.rows,
        skills: skillsRes.rows,
      },
    });
  } catch (err) {
    console.error('[Student getProfile Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve student profile.' });
  }
}

// 2. Update Student Profile
export async function updateProfile(req, res) {
  try {
    const studentProfileId = await getStudentProfileId(req.user.id);
    if (!studentProfileId) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const { university, program, degree, graduation_year, gpa, academic_progress, target_career_id, name } = req.body;

    // Validate GPA (0.0 to 10.0 scale)
    let validatedGpa = undefined;
    if (gpa !== undefined && gpa !== null && gpa !== '') {
      const parsedGpa = parseFloat(gpa);
      if (isNaN(parsedGpa) || parsedGpa < 0 || parsedGpa > 10.0) {
        return res.status(400).json({
          success: false,
          message: 'Cumulative GPA must be a valid number between 0.0 and 10.0.',
        });
      }
      validatedGpa = Math.round(parsedGpa * 100) / 100;
    }

    // Validate Graduation Year (2020 to 2035)
    let validatedGradYear = undefined;
    if (graduation_year !== undefined && graduation_year !== null && graduation_year !== '') {
      const parsedYear = parseInt(graduation_year, 10);
      if (isNaN(parsedYear) || parsedYear < 2020 || parsedYear > 2035) {
        return res.status(400).json({
          success: false,
          message: 'Graduation Year must be a valid 4-digit academic year between 2020 and 2035.',
        });
      }
      validatedGradYear = parsedYear;
    }

    // Validate Academic Progress (0 to 100%)
    let validatedProgress = undefined;
    if (academic_progress !== undefined && academic_progress !== null && academic_progress !== '') {
      const parsedProgress = parseFloat(academic_progress);
      if (isNaN(parsedProgress) || parsedProgress < 0 || parsedProgress > 100) {
        return res.status(400).json({
          success: false,
          message: 'Academic Progress must be a percentage between 0% and 100%.',
        });
      }
      validatedProgress = Math.round(parsedProgress * 10) / 10;
    }

    // Validate Target Career ID if provided
    let validatedCareerId = undefined;
    if (target_career_id !== undefined && target_career_id !== null && target_career_id !== '') {
      const careerRes = await query('SELECT id FROM careers WHERE id = $1', [target_career_id]);
      if (careerRes.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid target career specified.' });
      }
      validatedCareerId = target_career_id;
    }

    // Sanitize string inputs
    const trimmedUniv = university !== undefined ? (university.trim() || null) : undefined;
    const trimmedProg = program !== undefined ? (program.trim() || null) : undefined;
    const trimmedDeg = degree !== undefined ? (degree.trim() || null) : undefined;

    if (name && name.trim()) {
      await query('UPDATE users SET name = $1 WHERE id = $2', [name.trim(), req.user.id]);
    }

    await query(
      `UPDATE student_profiles
       SET university = COALESCE($1, university),
           program = COALESCE($2, program),
           degree = COALESCE($3, degree),
           graduation_year = COALESCE($4, graduation_year),
           gpa = COALESCE($5, gpa),
           academic_progress = COALESCE($6, academic_progress),
           target_career_id = COALESCE($7, target_career_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8`,
      [
        trimmedUniv,
        trimmedProg,
        trimmedDeg,
        validatedGradYear,
        validatedGpa,
        validatedProgress,
        validatedCareerId,
        studentProfileId,
      ]
    );

    // Fetch refreshed complete profile
    const updatedProfileRes = await query(
      `SELECT sp.*, u.name, u.email, c.title as target_career_title, c.industry as target_career_industry
       FROM student_profiles sp
       JOIN users u ON sp.user_id = u.id
       LEFT JOIN careers c ON sp.target_career_id = c.id
       WHERE sp.id = $1`,
      [studentProfileId]
    );

    const coursesRes = await query(
      `SELECT sc.id, sc.course_id, sc.grade, sc.status, sc.semester_taken,
              c.code, c.title, c.credits, c.department, c.difficulty_level
       FROM student_courses sc
       JOIN courses c ON sc.course_id = c.id
       WHERE sc.student_id = $1
       ORDER BY sc.created_at ASC`,
      [studentProfileId]
    );

    const skillsRes = await query(
      `SELECT ss.id, ss.skill_id, ss.proficiency, ss.verified,
              s.name, s.category, s.description
       FROM student_skills ss
       JOIN skills s ON ss.skill_id = s.id
       WHERE ss.student_id = $1
       ORDER BY s.name ASC`,
      [studentProfileId]
    );

    const completeProfile = {
      ...updatedProfileRes.rows[0],
      courses: coursesRes.rows,
      skills: skillsRes.rows,
    };

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      profile: completeProfile,
    });
  } catch (err) {
    console.error('[Student updateProfile Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to update student profile.' });
  }
}

// 3. Courses Management
export async function getCourses(req, res) {
  try {
    const studentProfileId = await getStudentProfileId(req.user.id);
    const coursesRes = await query(
      `SELECT sc.id, sc.course_id, sc.grade, sc.status, sc.semester_taken,
              c.code, c.title, c.credits, c.department, c.difficulty_level
       FROM student_courses sc
       JOIN courses c ON sc.course_id = c.id
       WHERE sc.student_id = $1
       ORDER BY sc.created_at ASC`,
      [studentProfileId]
    );

    return res.status(200).json({ success: true, courses: coursesRes.rows });
  } catch (err) {
    console.error('[Student getCourses Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch courses.' });
  }
}

export async function addCourse(req, res) {
  try {
    const studentProfileId = await getStudentProfileId(req.user.id);
    const { course_id, grade, status, semester_taken } = req.body;

    if (!course_id) {
      return res.status(400).json({ success: false, message: 'Course ID is required.' });
    }

    const validStatuses = ['completed', 'in_progress', 'planned'];
    const courseStatus = status || 'completed';
    if (!validStatuses.includes(courseStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course status. Allowed values: completed, in_progress, planned.',
      });
    }

    // Check if course exists in catalog
    const courseExists = await query('SELECT id FROM courses WHERE id = $1', [course_id]);
    if (courseExists.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Specified course does not exist in catalog.' });
    }

    // Check if already enrolled
    const existing = await query(
      'SELECT id FROM student_courses WHERE student_id = $1 AND course_id = $2',
      [studentProfileId, course_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'This course is already added to your profile.' });
    }

    await query(
      `INSERT INTO student_courses (student_id, course_id, grade, status, semester_taken)
       VALUES ($1, $2, $3, $4, $5)`,
      [studentProfileId, course_id, grade ? grade.trim() : null, courseStatus, semester_taken ? semester_taken.trim() : 'Current Semester']
    );

    return res.status(201).json({ success: true, message: 'Course added to your academic record.' });
  } catch (err) {
    console.error('[Student addCourse Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to add course.' });
  }
}

export async function updateCourseStatus(req, res) {
  try {
    const studentProfileId = await getStudentProfileId(req.user.id);
    const { id } = req.params;
    const { grade, status, semester_taken } = req.body;

    if (status) {
      const validStatuses = ['completed', 'in_progress', 'planned'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid course status. Allowed values: completed, in_progress, planned.',
        });
      }
    }

    await query(
      `UPDATE student_courses
       SET grade = COALESCE($1, grade),
           status = COALESCE($2, status),
           semester_taken = COALESCE($3, semester_taken)
       WHERE id = $4 AND student_id = $5`,
      [grade ? grade.trim() : null, status || null, semester_taken ? semester_taken.trim() : null, id, studentProfileId]
    );

    return res.status(200).json({ success: true, message: 'Course updated.' });
  } catch (err) {
    console.error('[Student updateCourseStatus Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to update course.' });
  }
}

export async function deleteCourse(req, res) {
  try {
    const studentProfileId = await getStudentProfileId(req.user.id);
    const { id } = req.params;

    await query('DELETE FROM student_courses WHERE id = $1 AND student_id = $2', [id, studentProfileId]);
    return res.status(200).json({ success: true, message: 'Course removed.' });
  } catch (err) {
    console.error('[Student deleteCourse Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to delete course.' });
  }
}

// 4. Skills Management
export async function getSkills(req, res) {
  try {
    const studentProfileId = await getStudentProfileId(req.user.id);
    const skillsRes = await query(
      `SELECT ss.id, ss.skill_id, ss.proficiency, ss.verified,
              s.name, s.category, s.description
       FROM student_skills ss
       JOIN skills s ON ss.skill_id = s.id
       WHERE ss.student_id = $1
       ORDER BY s.name ASC`,
      [studentProfileId]
    );

    return res.status(200).json({ success: true, skills: skillsRes.rows });
  } catch (err) {
    console.error('[Student getSkills Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch skills.' });
  }
}

export async function addSkill(req, res) {
  try {
    const studentProfileId = await getStudentProfileId(req.user.id);
    const { skill_id, skill_name, proficiency } = req.body;

    let targetSkillId = skill_id;

    // Validate proficiency
    const validProficiencies = ['Beginner', 'Intermediate', 'Advanced'];
    const chosenProficiency = proficiency || 'Beginner';
    if (!validProficiencies.includes(chosenProficiency)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid proficiency level. Allowed values: Beginner, Intermediate, Advanced.',
      });
    }

    // If skill_name provided instead of ID, find or create
    if (!targetSkillId && skill_name) {
      const existing = await query('SELECT id FROM skills WHERE LOWER(name) = LOWER($1)', [skill_name.trim()]);
      if (existing.rows.length > 0) {
        targetSkillId = existing.rows[0].id;
      } else {
        const insertRes = await query(
          'INSERT INTO skills (name, category, description) VALUES ($1, $2, $3) RETURNING id',
          [skill_name.trim(), 'Technical', `Skill added: ${skill_name.trim()}`]
        );
        targetSkillId = insertRes.rows[0].id;
      }
    }

    if (!targetSkillId) {
      return res.status(400).json({ success: false, message: 'Valid skill is required.' });
    }

    const checkExisting = await query(
      'SELECT id FROM student_skills WHERE student_id = $1 AND skill_id = $2',
      [studentProfileId, targetSkillId]
    );

    if (checkExisting.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'You already have this skill on your profile.' });
    }

    await query(
      `INSERT INTO student_skills (student_id, skill_id, proficiency, verified)
       VALUES ($1, $2, $3, 0)`,
      [studentProfileId, targetSkillId, chosenProficiency]
    );

    return res.status(201).json({ success: true, message: 'Skill added to profile.' });
  } catch (err) {
    console.error('[Student addSkill Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to add skill.' });
  }
}

export async function updateSkill(req, res) {
  try {
    const studentProfileId = await getStudentProfileId(req.user.id);
    const { id } = req.params;
    const { proficiency } = req.body;

    const validProficiencies = ['Beginner', 'Intermediate', 'Advanced'];
    if (!proficiency || !validProficiencies.includes(proficiency)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid proficiency level. Allowed values: Beginner, Intermediate, Advanced.',
      });
    }

    await query(
      'UPDATE student_skills SET proficiency = $1 WHERE id = $2 AND student_id = $3',
      [proficiency, id, studentProfileId]
    );

    return res.status(200).json({ success: true, message: 'Skill updated.' });
  } catch (err) {
    console.error('[Student updateSkill Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to update skill.' });
  }
}

export async function deleteSkill(req, res) {
  try {
    const studentProfileId = await getStudentProfileId(req.user.id);
    const { id } = req.params;

    await query('DELETE FROM student_skills WHERE id = $1 AND student_id = $2', [id, studentProfileId]);
    return res.status(200).json({ success: true, message: 'Skill removed.' });
  } catch (err) {
    console.error('[Student deleteSkill Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to delete skill.' });
  }
}

// 5. Dashboard Summary (High-level aggregated stats for student dashboard)
export async function getDashboardSummary(req, res) {
  try {
    const studentProfileId = await getStudentProfileId(req.user.id);
    if (!studentProfileId) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    // Profile & Career
    const profileRes = await query(
      `SELECT sp.*, u.name, u.email, c.title as target_career_title, c.industry as target_career_industry
       FROM student_profiles sp
       JOIN users u ON sp.user_id = u.id
       LEFT JOIN careers c ON sp.target_career_id = c.id
       WHERE sp.id = $1`,
      [studentProfileId]
    );
    const profile = profileRes.rows[0];

    // Completed Courses Count & Credits
    const coursesStats = await query(
      `SELECT 
        COUNT(sc.id) as total_courses,
        COALESCE(SUM(CASE WHEN sc.status = 'completed' THEN 1 ELSE 0 END), 0) as completed_courses,
        COALESCE(SUM(CASE WHEN sc.status = 'in_progress' THEN 1 ELSE 0 END), 0) as in_progress_courses,
        COALESCE(SUM(CASE WHEN sc.status = 'completed' THEN c.credits ELSE 0 END), 0) as completed_credits
       FROM student_courses sc
       JOIN courses c ON sc.course_id = c.id
       WHERE sc.student_id = $1`,
      [studentProfileId]
    );

    // Current Skills
    const skillsRes = await query(
      `SELECT ss.proficiency, s.name, s.category
       FROM student_skills ss
       JOIN skills s ON ss.skill_id = s.id
       WHERE ss.student_id = $1`,
      [studentProfileId]
    );

    // Roadmap Progress - prioritize student's active target_career_id, then most recently created
    const roadmapRes = await query(
      `SELECT cr.id, cr.title,
        COUNT(ri.id) as total_steps,
        COALESCE(SUM(CASE WHEN ri.completed = 1 THEN 1 ELSE 0 END), 0) as completed_steps
       FROM career_roadmaps cr
       LEFT JOIN roadmap_items ri ON cr.id = ri.roadmap_id
       WHERE cr.student_id = $1
       GROUP BY cr.id, cr.title, cr.career_id, cr.created_at
       ORDER BY (CASE WHEN cr.career_id = $2 THEN 0 ELSE 1 END), cr.created_at DESC
       LIMIT 1`,
      [studentProfileId, profile.target_career_id]
    );

    // Skill Gap Count
    let gapSummary = { matches: 0, gaps: 0, missing: 0 };
    if (profile.target_career_id) {
      const requiredSkillsRes = await query(
        `SELECT cs.required_proficiency, s.id as skill_id, s.name,
                ss.proficiency as current_proficiency
         FROM career_skills cs
         JOIN skills s ON cs.skill_id = s.id
         LEFT JOIN student_skills ss ON ss.skill_id = s.id AND ss.student_id = $1
         WHERE cs.career_id = $2`,
        [studentProfileId, profile.target_career_id]
      );

      const rank = { Beginner: 1, Intermediate: 2, Advanced: 3 };
      for (const item of requiredSkillsRes.rows) {
        if (!item.current_proficiency) {
          gapSummary.missing++;
        } else if ((rank[item.current_proficiency] || 0) < (rank[item.required_proficiency] || 2)) {
          gapSummary.gaps++;
        } else {
          gapSummary.matches++;
        }
      }
    }

    // Recent Resume Score
    const resumeRes = await query(
      `SELECT overall_score, career_alignment_score, created_at
       FROM resume_analyses
       WHERE student_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [studentProfileId]
    );

    return res.status(200).json({
      success: true,
      summary: {
        studentName: profile.name,
        email: profile.email,
        program: profile.program,
        degree: profile.degree,
        university: profile.university,
        gpa: profile.gpa,
        academicProgress: profile.academic_progress,
        targetCareer: profile.target_career_title || 'Not Selected',
        courses: {
          total_courses: parseInt(coursesStats.rows[0]?.total_courses || 0, 10),
          completed_courses: parseInt(coursesStats.rows[0]?.completed_courses || 0, 10),
          in_progress_courses: parseInt(coursesStats.rows[0]?.in_progress_courses || 0, 10),
          completed_credits: parseInt(coursesStats.rows[0]?.completed_credits || 0, 10),
        },
        skills: skillsRes.rows,
        roadmap: roadmapRes.rows[0] || null,
        skillGaps: gapSummary,
        recentResume: resumeRes.rows[0] || null,
      },
    });
  } catch (err) {
    console.error('[Student getDashboardSummary Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to generate dashboard summary.' });
  }
}

// 6. Public Lists (For selection dropdowns in profile, roadmap, etc.)
export async function getAvailableCareers(req, res) {
  try {
    const careers = await query('SELECT * FROM careers ORDER BY title ASC');
    return res.status(200).json({ success: true, careers: careers.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch careers.' });
  }
}

export async function getAvailableCourses(req, res) {
  try {
    const courses = await query('SELECT * FROM courses ORDER BY code ASC');
    return res.status(200).json({ success: true, courses: courses.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch courses.' });
  }
}

export async function getAvailableSkills(req, res) {
  try {
    const skills = await query('SELECT * FROM skills ORDER BY name ASC');
    return res.status(200).json({ success: true, skills: skills.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch skills.' });
  }
}
