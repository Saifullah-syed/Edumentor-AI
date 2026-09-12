import { query } from '../db/index.js';
import { extractTextFromFile } from '../services/resumeParser.service.js';
import { analyzeResumeAi } from '../services/gemini.service.js';

// 1. Upload & Analyze Resume
export async function uploadAndAnalyze(req, res) {
  try {
    const studentRes = await query(
      `SELECT sp.id, c.title as target_career_title
       FROM student_profiles sp
       LEFT JOIN careers c ON sp.target_career_id = c.id
       WHERE sp.user_id = $1`,
      [req.user.id]
    );
    const student = studentRes.rows[0];
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select a valid PDF resume file (.pdf).',
      });
    }

    if (req.file.size === 0) {
      return res.status(400).json({
        success: false,
        message: 'The uploaded file is empty. Please upload a valid resume.',
      });
    }

    const { buffer, mimetype, originalname, size } = req.file;

    // Extract text
    let extractedText = '';
    try {
      extractedText = await extractTextFromFile({ buffer, mimetype, originalname });
    } catch (parseErr) {
      return res.status(422).json({
        success: false,
        message: `File parsing error: ${parseErr.message}`,
      });
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return res.status(422).json({
        success: false,
        message: 'Unable to extract sufficient legible text from the resume. Please ensure the document is not an empty or scanned image file.',
      });
    }

    const targetCareer = req.body.target_career || student.target_career_title || 'Software Engineer';

    // AI Analysis
    const analysis = await analyzeResumeAi({
      resumeText: extractedText,
      targetCareer,
    });

    // Save to Database
    const overallScore = typeof analysis.overall_score === 'number' ? analysis.overall_score : 0;
    const alignmentScore = typeof analysis.career_alignment_score === 'number' ? analysis.career_alignment_score : 0;

    const insertRes = await query(
      `INSERT INTO resume_analyses (
        student_id, filename, file_size, overall_score, career_alignment_score,
        summary, strengths_json, weaknesses_json, missing_skills_json,
        recommendations_json, recommended_projects_json
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        student.id,
        originalname,
        size,
        overallScore,
        alignmentScore,
        analysis.summary || 'Resume analyzed.',
        JSON.stringify(analysis.strengths || []),
        JSON.stringify(analysis.weaknesses || []),
        JSON.stringify(analysis.missing_skills || []),
        JSON.stringify(analysis.recommendations || []),
        JSON.stringify(analysis.recommended_projects || []),
      ]
    );

    const savedRecord = insertRes.rows[0];

    return res.status(200).json({
      success: true,
      message: analysis.is_valid_resume === false
        ? 'Document evaluated: Insufficient Resume Content detected.'
        : 'Resume analyzed successfully!',
      analysis: {
        ...savedRecord,
        is_valid_resume: analysis.is_valid_resume !== false,
        status: analysis.status || (analysis.is_valid_resume === false ? 'INSUFFICIENT_CONTENT' : 'VERIFIED'),
        strengths: analysis.strengths || [],
        weaknesses: analysis.weaknesses || [],
        missing_skills: analysis.missing_skills || [],
        recommendations: analysis.recommendations || [],
        recommended_projects: analysis.recommended_projects || [],
        suggested_next_steps: analysis.suggested_next_steps || [],
      },
    });
  } catch (err) {
    console.error('[Resume uploadAndAnalyze Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Internal error while analyzing resume. Please try again.',
    });
  }
}

// 2. Get Past Analyses History
export async function getResumeHistory(req, res) {
  try {
    const studentRes = await query('SELECT id FROM student_profiles WHERE user_id = $1', [req.user.id]);
    const student = studentRes.rows[0];
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const recordsRes = await query(
      `SELECT id, filename, file_size, overall_score, career_alignment_score, summary, created_at
       FROM resume_analyses
       WHERE student_id = $1
       ORDER BY created_at DESC`,
      [student.id]
    );

    return res.status(200).json({
      success: true,
      history: recordsRes.rows,
    });
  } catch (err) {
    console.error('[Resume getResumeHistory Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve resume history.' });
  }
}

// 3. Get Single Analysis Detail
export async function getAnalysisDetail(req, res) {
  try {
    const studentRes = await query('SELECT id FROM student_profiles WHERE user_id = $1', [req.user.id]);
    const student = studentRes.rows[0];
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const { id } = req.params;
    const recordRes = await query(
      'SELECT * FROM resume_analyses WHERE id = $1 AND student_id = $2',
      [id, student.id]
    );

    if (recordRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Analysis record not found.' });
    }

    const rec = recordRes.rows[0];
    return res.status(200).json({
      success: true,
      analysis: {
        ...rec,
        strengths: JSON.parse(rec.strengths_json || '[]'),
        weaknesses: JSON.parse(rec.weaknesses_json || '[]'),
        missing_skills: JSON.parse(rec.missing_skills_json || '[]'),
        recommendations: JSON.parse(rec.recommendations_json || '[]'),
        recommended_projects: JSON.parse(rec.recommended_projects_json || '[]'),
      },
    });
  } catch (err) {
    console.error('[Resume getAnalysisDetail Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve analysis detail.' });
  }
}
