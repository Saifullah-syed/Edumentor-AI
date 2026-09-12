import { query } from '../db/index.js';
import { generateLearningPlanAi } from '../services/gemini.service.js';

// 1. Get Student Learning Plan
export async function getLearningPlan(req, res) {
  try {
    const studentRes = await query('SELECT id, target_career_id FROM student_profiles WHERE user_id = $1', [req.user.id]);
    const student = studentRes.rows[0];
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const planRes = await query(
      'SELECT * FROM learning_plans WHERE student_id = $1 ORDER BY created_at DESC LIMIT 1',
      [student.id]
    );

    const plan = planRes.rows[0];
    if (!plan) {
      return res.status(200).json({ success: true, plan: null, items: [] });
    }

    const itemsRes = await query(
      'SELECT * FROM learning_plan_items WHERE plan_id = $1 ORDER BY week_number ASC',
      [plan.id]
    );

    const formattedItems = itemsRes.rows.map(item => ({
      ...item,
      tasks: JSON.parse(item.tasks_json || '[]'),
    }));

    const completedCount = formattedItems.filter(i => i.completed === 1).length;
    const totalCount = formattedItems.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return res.status(200).json({
      success: true,
      plan,
      progressPercent,
      completedCount,
      totalCount,
      items: formattedItems,
    });
  } catch (err) {
    console.error('[LearningPlan getLearningPlan Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve learning plan.' });
  }
}

// 2. Generate or Re-generate Learning Plan
export async function generateLearningPlan(req, res) {
  try {
    const studentRes = await query(
      `SELECT sp.id, sp.target_career_id, c.title as target_career_title
       FROM student_profiles sp
       LEFT JOIN careers c ON sp.target_career_id = c.id
       WHERE sp.user_id = $1`,
      [req.user.id]
    );
    const student = studentRes.rows[0];
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const { target_career, timeframe_weeks = 8, hours_per_week = 10 } = req.body;
    const careerToUse = target_career || student.target_career_title || 'Software Engineering';

    const weeksInt = parseInt(timeframe_weeks, 10) || 8;
    const hoursInt = parseInt(hours_per_week, 10) || 10;

    // Fetch student skills
    const skillsRes = await query(
      `SELECT s.name FROM student_skills ss JOIN skills s ON ss.skill_id = s.id WHERE ss.student_id = $1`,
      [student.id]
    );
    const skillNames = skillsRes.rows.map(r => r.name);

    // Fetch student coursework
    const coursesRes = await query(
      `SELECT c.code, c.title FROM student_courses sc JOIN courses c ON sc.course_id = c.id WHERE sc.student_id = $1`,
      [student.id]
    );
    const courseworkNames = coursesRes.rows.map(r => `${r.code} - ${r.title}`);

    // Fetch career required skill gaps
    const gapsRes = await query(
      `SELECT s.name FROM career_skills cs
       JOIN skills s ON cs.skill_id = s.id
       JOIN careers c ON cs.career_id = c.id
       LEFT JOIN student_skills ss ON ss.skill_id = s.id AND ss.student_id = $1
       WHERE LOWER(c.title) = LOWER($2) AND ss.id IS NULL`,
      [student.id, careerToUse]
    );
    const skillGapNames = gapsRes.rows.map(r => r.name);

    // Call AI
    const aiData = await generateLearningPlanAi({
      targetCareer: careerToUse,
      timeframeWeeks: weeksInt,
      hoursPerWeek: hoursInt,
      currentSkills: skillNames,
      skillGaps: skillGapNames,
      coursework: courseworkNames,
    });

    // Clean previous plans
    const prevPlans = await query('SELECT id FROM learning_plans WHERE student_id = $1', [student.id]);
    for (const p of prevPlans.rows) {
      await query('DELETE FROM learning_plan_items WHERE plan_id = $1', [p.id]);
      await query('DELETE FROM learning_plans WHERE id = $1', [p.id]);
    }

    // Save new plan
    const newPlanRes = await query(
      `INSERT INTO learning_plans (student_id, title, target_career, timeframe_weeks, hours_per_week)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [student.id, aiData.title, careerToUse, weeksInt, hoursInt]
    );
    const plan = newPlanRes.rows[0];

    const savedItems = [];
    for (const w of (aiData.weeks || [])) {
      const itemRes = await query(
        `INSERT INTO learning_plan_items (plan_id, week_number, topic, objective, tasks_json, resources, completed)
         VALUES ($1, $2, $3, $4, $5, $6, 0) RETURNING *`,
        [plan.id, w.week, w.topic, w.objective, JSON.stringify(w.tasks || []), w.resources || '']
      );
      savedItems.push({
        ...itemRes.rows[0],
        tasks: w.tasks || [],
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Personalized learning plan generated successfully!',
      plan,
      progressPercent: 0,
      completedCount: 0,
      totalCount: savedItems.length,
      items: savedItems,
    });
  } catch (err) {
    console.error('[LearningPlan generateLearningPlan Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to generate learning plan.' });
  }
}

// 3. Toggle Week Item Completed
export async function togglePlanItem(req, res) {
  try {
    const studentRes = await query('SELECT id FROM student_profiles WHERE user_id = $1', [req.user.id]);
    const student = studentRes.rows[0];
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const { itemId } = req.params;
    const { completed } = req.body;

    const itemRes = await query(
      `SELECT lpi.*, lp.student_id
       FROM learning_plan_items lpi
       JOIN learning_plans lp ON lpi.plan_id = lp.id
       WHERE lpi.id = $1 AND lp.student_id = $2`,
      [itemId, student.id]
    );

    if (itemRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Plan item not found.' });
    }

    const newStatus = completed ? 1 : 0;
    await query('UPDATE learning_plan_items SET completed = $1 WHERE id = $2', [newStatus, itemId]);

    return res.status(200).json({
      success: true,
      message: `Week ${newStatus === 1 ? 'marked complete' : 'marked in progress'}.`,
      completed: newStatus === 1,
    });
  } catch (err) {
    console.error('[LearningPlan togglePlanItem Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to update plan item.' });
  }
}
