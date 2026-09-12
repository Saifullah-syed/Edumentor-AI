import { query } from '../db/index.js';

export async function getSkillGapAnalysis(req, res) {
  try {
    const studentRes = await query('SELECT id, target_career_id FROM student_profiles WHERE user_id = $1', [req.user.id]);
    const studentProfile = studentRes.rows[0];

    if (!studentProfile) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    // Allow user to query a specific career or use their target career
    const careerId = req.query.career_id || studentProfile.target_career_id;

    if (!careerId) {
      return res.status(400).json({
        success: false,
        message: 'No target career selected. Please select a career from your profile or provide career_id.',
      });
    }

    // Get Career Info
    const careerRes = await query('SELECT * FROM careers WHERE id = $1', [careerId]);
    if (careerRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Career target not found.' });
    }
    const career = careerRes.rows[0];

    // Get Benchmark Skills required for this career
    const requiredSkillsRes = await query(
      `SELECT cs.id as career_skill_id, cs.required_proficiency, cs.importance,
              s.id as skill_id, s.name as skill_name, s.category, s.description
       FROM career_skills cs
       JOIN skills s ON cs.skill_id = s.id
       WHERE cs.career_id = $1
       ORDER BY cs.importance ASC, s.name ASC`,
      [careerId]
    );

    // Get Student's current skills
    const studentSkillsRes = await query(
      `SELECT ss.proficiency, ss.verified, s.id as skill_id, s.name as skill_name
       FROM student_skills ss
       JOIN skills s ON ss.skill_id = s.id
       WHERE ss.student_id = $1`,
      [studentProfile.id]
    );

    const studentSkillMap = {};
    for (const sk of studentSkillsRes.rows) {
      studentSkillMap[sk.skill_id] = sk;
    }

    const rank = { Beginner: 1, Intermediate: 2, Advanced: 3 };

    let matchesCount = 0;
    let gapsCount = 0;
    let missingCount = 0;

    const analysisItems = requiredSkillsRes.rows.map((reqSkill) => {
      const studentSkill = studentSkillMap[reqSkill.skill_id];
      const currentLevel = studentSkill ? studentSkill.proficiency : 'Not Acquired';
      const requiredLevel = reqSkill.required_proficiency;

      let status = 'MISSING';
      let gapLevel = 2; // high gap
      let recommendation = `Acquire foundational skills in ${reqSkill.skill_name} through structured introductory coursework or online certifications.`;

      if (!studentSkill) {
        status = 'MISSING';
        missingCount++;
      } else {
        const studentRank = rank[studentSkill.proficiency] || 1;
        const requiredRank = rank[requiredLevel] || 2;

        if (studentRank >= requiredRank) {
          status = 'MATCH';
          gapLevel = 0;
          matchesCount++;
          recommendation = `Great job! Your ${studentSkill.proficiency} proficiency satisfies the ${requiredLevel} industry requirement for ${career.title}.`;
        } else {
          status = 'GAP';
          gapLevel = requiredRank - studentRank;
          gapsCount++;
          recommendation = `Bridge your ${studentSkill.proficiency} level to ${requiredLevel} by completing practical projects and advanced exercises in ${reqSkill.skill_name}.`;
        }
      }

      return {
        skill_id: reqSkill.skill_id,
        skill_name: reqSkill.skill_name,
        category: reqSkill.category,
        description: reqSkill.description,
        importance: reqSkill.importance,
        required_proficiency: requiredLevel,
        current_proficiency: currentLevel,
        status, // 'MATCH' | 'GAP' | 'MISSING'
        gapLevel,
        recommendation,
      };
    });

    const totalRequired = requiredSkillsRes.rows.length;
    const matchPercentage = totalRequired > 0 ? Math.round((matchesCount / totalRequired) * 100) : 0;

    return res.status(200).json({
      success: true,
      career,
      matchPercentage,
      summary: {
        totalRequired,
        matches: matchesCount,
        gaps: gapsCount,
        missing: missingCount,
      },
      skills: analysisItems,
    });
  } catch (err) {
    console.error('[Skill Gap Analysis Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to compute skill gap analysis.' });
  }
}
