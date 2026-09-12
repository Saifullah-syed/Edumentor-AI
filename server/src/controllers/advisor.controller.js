import { query } from '../db/index.js';
import { generateAdvisorResponse } from '../services/gemini.service.js';

// 1. Get or Create active conversation
async function getOrCreateActiveConversation(studentId) {
  const existing = await query(
    'SELECT * FROM ai_conversations WHERE student_id = $1 ORDER BY updated_at DESC LIMIT 1',
    [studentId]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const newConv = await query(
    `INSERT INTO ai_conversations (student_id, title)
     VALUES ($1, 'Academic Advising Session') RETURNING *`,
    [studentId]
  );
  return newConv.rows[0];
}

// 2. Get Messages for Conversation
export async function getConversation(req, res) {
  try {
    const studentRes = await query('SELECT id FROM student_profiles WHERE user_id = $1', [req.user.id]);
    const studentId = studentRes.rows[0]?.id;
    if (!studentId) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const conv = await getOrCreateActiveConversation(studentId);

    const messagesRes = await query(
      `SELECT id, sender, content, disclaimer_shown, created_at
       FROM ai_messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [conv.id]
    );

    return res.status(200).json({
      success: true,
      conversationId: conv.id,
      title: conv.title,
      messages: messagesRes.rows,
      suggestedQuestions: [
        'What courses should I take next semester?',
        'What skills do I need to become a data scientist?',
        'What should I learn after Python?',
        'What projects should I build for my career?',
        'How can I improve my academic progress and GPA?',
      ],
    });
  } catch (err) {
    console.error('[Advisor getConversation Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve conversation history.' });
  }
}

// 3. Send Message to AI Advisor
export async function sendMessage(req, res) {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
    }

    const studentRes = await query(
      `SELECT sp.*, u.name, u.email, c.title as target_career_title
       FROM student_profiles sp
       JOIN users u ON sp.user_id = u.id
       LEFT JOIN careers c ON sp.target_career_id = c.id
       WHERE sp.user_id = $1`,
      [req.user.id]
    );
    const student = studentRes.rows[0];
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    // Fetch courses and skills to enrich context
    const coursesRes = await query(
      `SELECT sc.status, c.code, c.title
       FROM student_courses sc
       JOIN courses c ON sc.course_id = c.id
       WHERE sc.student_id = $1`,
      [student.id]
    );

    const skillsRes = await query(
      `SELECT ss.proficiency, s.name
       FROM student_skills ss
       JOIN skills s ON ss.skill_id = s.id
       WHERE ss.student_id = $1`,
      [student.id]
    );

    const completedCourses = coursesRes.rows.filter(c => c.status === 'completed').map(c => `${c.code}: ${c.title}`);
    const inProgressCourses = coursesRes.rows.filter(c => c.status === 'in_progress').map(c => `${c.code}: ${c.title}`);
    const currentSkills = skillsRes.rows.map(s => ({ name: s.name, proficiency: s.proficiency }));

    const fullProfile = {
      name: student.name,
      program: student.program,
      degree: student.degree,
      university: student.university,
      gpa: student.gpa,
      academic_progress: student.academic_progress,
      target_career_title: student.target_career_title,
      completed_courses: completedCourses,
      in_progress_courses: inProgressCourses,
      skills: currentSkills,
    };

    const conv = await getOrCreateActiveConversation(student.id);

    // Save User Message
    await query(
      `INSERT INTO ai_messages (conversation_id, sender, content, disclaimer_shown)
       VALUES ($1, 'user', $2, 0)`,
      [conv.id, message.trim()]
    );

    // Fetch last few messages for chat memory
    const historyRes = await query(
      'SELECT sender, content FROM ai_messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT 10',
      [conv.id]
    );

    // Generate AI response
    const aiResult = await generateAdvisorResponse({
      studentProfile: fullProfile,
      message: message.trim(),
      chatHistory: historyRes.rows,
    });

    // Save AI Response
    const savedAiMsgRes = await query(
      `INSERT INTO ai_messages (conversation_id, sender, content, disclaimer_shown)
       VALUES ($1, 'ai', $2, 1) RETURNING id, sender, content, disclaimer_shown, created_at`,
      [conv.id, aiResult.content]
    );

    // Update conversation timestamp
    await query('UPDATE ai_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [conv.id]);

    return res.status(200).json({
      success: true,
      message: savedAiMsgRes.rows[0],
      isMockAi: aiResult.isMockAi,
    });
  } catch (err) {
    console.error('[Advisor sendMessage Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate advisory response. Please try again.',
    });
  }
}

// 4. Clear Conversation History
export async function clearConversation(req, res) {
  try {
    const studentRes = await query('SELECT id FROM student_profiles WHERE user_id = $1', [req.user.id]);
    const studentId = studentRes.rows[0]?.id;
    if (!studentId) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const conv = await query('SELECT id FROM ai_conversations WHERE student_id = $1', [studentId]);
    for (const row of conv.rows) {
      await query('DELETE FROM ai_messages WHERE conversation_id = $1', [row.id]);
      await query('DELETE FROM ai_conversations WHERE id = $1', [row.id]);
    }

    return res.status(200).json({ success: true, message: 'Conversation history cleared.' });
  } catch (err) {
    console.error('[Advisor clearConversation Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to clear conversation.' });
  }
}
