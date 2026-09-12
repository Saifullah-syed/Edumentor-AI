import { query } from '../db/index.js';
import { generateCareerRoadmapAi } from '../services/gemini.service.js';

// 1. Get Roadmap for Student
export async function getRoadmap(req, res) {
  try {
    const studentRes = await query('SELECT id, target_career_id FROM student_profiles WHERE user_id = $1', [req.user.id]);
    const student = studentRes.rows[0];
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const careerId = req.query.career_id ? parseInt(req.query.career_id, 10) : student.target_career_id;

    // Synchronize target_career_id in student_profiles if explicitly requested via career_id
    if (careerId && careerId !== student.target_career_id) {
      await query(
        `UPDATE student_profiles SET target_career_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [careerId, student.id]
      );
    }

    // Look up roadmap
    let roadmapRes = await query(
      `SELECT cr.*, c.title as career_title, c.industry as career_industry
       FROM career_roadmaps cr
       JOIN careers c ON cr.career_id = c.id
       WHERE cr.student_id = $1 ${careerId ? 'AND cr.career_id = $2' : ''}
       ORDER BY cr.created_at DESC LIMIT 1`,
      careerId ? [student.id, careerId] : [student.id]
    );

    let roadmap = roadmapRes.rows[0];

    // Check if existing roadmap has the old generic placeholder items (e.g. 'Domain-Specific Core Technologies')
    // If so, replace it with the new career-specific stages
    if (roadmap) {
      const checkGeneric = await query(
        `SELECT id FROM roadmap_items WHERE roadmap_id = $1 AND skill_or_topic = $2 LIMIT 1`,
        [roadmap.id, 'Domain-Specific Core Technologies']
      );
      if (checkGeneric.rows.length > 0) {
        await query('DELETE FROM roadmap_items WHERE roadmap_id = $1', [roadmap.id]);
        await query('DELETE FROM career_roadmaps WHERE id = $1', [roadmap.id]);
        roadmap = null;
      }
    }

    // If no roadmap exists yet for this career, automatically generate or fetch
    if (!roadmap && careerId) {
      const career = (await query('SELECT * FROM careers WHERE id = $1', [careerId])).rows[0];
      if (career) {
        // Fetch current skills
        const skillsRes = await query(
          `SELECT s.name FROM student_skills ss JOIN skills s ON ss.skill_id = s.id WHERE ss.student_id = $1`,
          [student.id]
        );
        const skillNames = skillsRes.rows.map(r => r.name);

        const aiData = await generateCareerRoadmapAi({ careerTitle: career.title, currentSkills: skillNames });

        const newRoadmapRes = await query(
          `INSERT INTO career_roadmaps (student_id, career_id, title, summary)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [student.id, career.id, aiData.title, aiData.summary]
        );
        roadmap = { ...newRoadmapRes.rows[0], career_title: career.title, career_industry: career.industry };

        for (const stage of (aiData.stages || [])) {
          await query(
            `INSERT INTO roadmap_items (roadmap_id, step_number, skill_or_topic, description, resources, difficulty, completed)
             VALUES ($1, $2, $3, $4, $5, $6, 0)`,
            [roadmap.id, stage.step, stage.skill_or_topic, stage.description, stage.resources || '', stage.difficulty || 'Intermediate']
          );
        }
      }
    }

    if (!roadmap) {
      return res.status(200).json({ success: true, roadmap: null, items: [] });
    }

    // Fetch items
    const itemsRes = await query(
      `SELECT * FROM roadmap_items WHERE roadmap_id = $1 ORDER BY step_number ASC`,
      [roadmap.id]
    );

    const completedCount = itemsRes.rows.filter(i => i.completed === 1).length;
    const totalCount = itemsRes.rows.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return res.status(200).json({
      success: true,
      roadmap,
      progressPercent,
      completedCount,
      totalCount,
      items: itemsRes.rows,
    });
  } catch (err) {
    console.error('[Roadmap getRoadmap Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve career roadmap.' });
  }
}

// 2. Generate New Roadmap (Re-generate or select different career)
export async function generateRoadmap(req, res) {
  try {
    const studentRes = await query('SELECT id FROM student_profiles WHERE user_id = $1', [req.user.id]);
    const student = studentRes.rows[0];
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const { career_id } = req.body;
    if (!career_id) {
      return res.status(400).json({ success: false, message: 'career_id is required.' });
    }

    const parsedCareerId = parseInt(career_id, 10);
    const career = (await query('SELECT * FROM careers WHERE id = $1', [parsedCareerId])).rows[0];
    if (!career) {
      return res.status(404).json({ success: false, message: 'Career not found.' });
    }

    // Keep student profile target career in sync
    await query(
      `UPDATE student_profiles SET target_career_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [parsedCareerId, student.id]
    );

    // Delete existing roadmap for this career to replace with fresh AI generated plan
    const existing = await query('SELECT id FROM career_roadmaps WHERE student_id = $1 AND career_id = $2', [student.id, career.id]);
    for (const r of existing.rows) {
      await query('DELETE FROM roadmap_items WHERE roadmap_id = $1', [r.id]);
      await query('DELETE FROM career_roadmaps WHERE id = $1', [r.id]);
    }

    // Fetch student skills
    const skillsRes = await query(
      `SELECT s.name FROM student_skills ss JOIN skills s ON ss.skill_id = s.id WHERE ss.student_id = $1`,
      [student.id]
    );
    const skillNames = skillsRes.rows.map(r => r.name);

    const aiData = await generateCareerRoadmapAi({ careerTitle: career.title, currentSkills: skillNames });

    const newRoadmapRes = await query(
      `INSERT INTO career_roadmaps (student_id, career_id, title, summary)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [student.id, career.id, aiData.title, aiData.summary]
    );
    const roadmap = newRoadmapRes.rows[0];

    const items = [];
    for (const stage of (aiData.stages || [])) {
      const itemRes = await query(
        `INSERT INTO roadmap_items (roadmap_id, step_number, skill_or_topic, description, resources, difficulty, completed)
         VALUES ($1, $2, $3, $4, $5, $6, 0) RETURNING *`,
        [roadmap.id, stage.step, stage.skill_or_topic, stage.description, stage.resources || '', stage.difficulty || 'Intermediate']
      );
      items.push(itemRes.rows[0]);
    }

    return res.status(201).json({
      success: true,
      message: 'Career roadmap generated successfully!',
      roadmap: { ...roadmap, career_title: career.title },
      items,
      progressPercent: 0,
    });
  } catch (err) {
    console.error('[Roadmap generateRoadmap Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to generate career roadmap.' });
  }
}

// 3. Toggle Completion Status of Roadmap Item
export async function toggleMilestone(req, res) {
  try {
    const studentRes = await query('SELECT id FROM student_profiles WHERE user_id = $1', [req.user.id]);
    const student = studentRes.rows[0];
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const { itemId } = req.params;
    const { completed } = req.body;

    // Verify ownership
    const itemRes = await query(
      `SELECT ri.*, cr.student_id
       FROM roadmap_items ri
       JOIN career_roadmaps cr ON ri.roadmap_id = cr.id
       WHERE ri.id = $1 AND cr.student_id = $2`,
      [itemId, student.id]
    );

    if (itemRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Roadmap milestone item not found.' });
    }

    const newStatus = completed ? 1 : 0;
    await query('UPDATE roadmap_items SET completed = $1 WHERE id = $2', [newStatus, itemId]);

    return res.status(200).json({
      success: true,
      message: `Milestone marked as ${newStatus === 1 ? 'completed' : 'in progress'}.`,
      completed: newStatus === 1,
    });
  } catch (err) {
    console.error('[Roadmap toggleMilestone Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to update milestone status.' });
  }
}
