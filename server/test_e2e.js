import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting EduMentor AI End-to-End Automated Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    console.log('1. Verifying System Health & Database Layer:');
    const healthRes = await fetch(`${BASE_URL}/health`).then((r) => r.json());
    assert(healthRes.status === 'online', 'Health endpoint status is online');
    assert(healthRes.database?.engine, `Database engine active: ${healthRes.database?.engine}`);

    // 2. Student Authentication (Alex Johnson)
    console.log('\n2. Testing Student Authentication:');
    const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex@student.edu', password: 'Student123!' }),
    }).then((r) => r.json());

    assert(studentLoginRes.success === true, 'Student login succeeded');
    assert(studentLoginRes.user?.role === 'student', 'User role is student');
    assert(studentLoginRes.token != null, 'JWT token issued to student');
    const studentToken = studentLoginRes.token;

    // 3. Student Dashboard Summary
    console.log('\n3. Testing Student Dashboard Summary:');
    const dashRes = await fetch(`${BASE_URL}/student/dashboard`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    }).then((r) => r.json());

    assert(dashRes.success === true, 'Dashboard summary retrieved');
    assert(dashRes.summary?.studentName === 'Alex Johnson', 'Student name is Alex Johnson');
    assert(dashRes.summary?.academicProgress === 68, 'Academic progress is 68%');
    assert(dashRes.summary?.targetCareer === 'Data Scientist', 'Target career is Data Scientist');
    assert(dashRes.summary?.skills?.length >= 4, `Student has ${dashRes.summary?.skills?.length} skills`);

    // 4. AI Academic Advisor
    console.log('\n4. Testing AI Academic Advisor:');
    const advisorMsgRes = await fetch(`${BASE_URL}/advisor/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ message: 'What courses should I take next semester?' }),
    }).then((r) => r.json());

    assert(advisorMsgRes.success === true, 'AI Advisor responded to query');
    assert(advisorMsgRes.message?.content.length > 50, 'AI generated structured advice');
    assert(advisorMsgRes.message?.disclaimer_shown === 1, 'Responsible AI disclaimer is attached');

    // 5. Career Roadmap
    console.log('\n5. Testing Career Roadmap & Milestones:');
    const roadmapRes = await fetch(`${BASE_URL}/roadmap`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    }).then((r) => r.json());

    assert(roadmapRes.success === true, 'Career roadmap retrieved');
    assert(roadmapRes.items?.length === 7, '7 milestone stages present');

    const milestone2 = roadmapRes.items[1];
    const initialCompleted = milestone2.completed;
    const toggleRes = await fetch(`${BASE_URL}/roadmap/milestones/${milestone2.id}/toggle`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ completed: !initialCompleted }),
    }).then((r) => r.json());

    assert(toggleRes.success === true, 'Milestone completion state toggled successfully');

    // 6. Skill Gap Analysis
    console.log('\n6. Testing Skill Gap Analysis Matrix:');
    const gapRes = await fetch(`${BASE_URL}/skillgap`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    }).then((r) => r.json());

    assert(gapRes.success === true, 'Skill gap analysis computed');
    assert(gapRes.summary?.matches >= 1, `Matches detected: ${gapRes.summary?.matches}`);
    assert(gapRes.summary?.gaps >= 1, `Gaps detected: ${gapRes.summary?.gaps}`);
    assert(gapRes.skills?.every((s) => s.recommendation != null), 'AI recommendation provided for each skill');

    // 7. Personalized Learning Plan
    console.log('\n7. Testing Personalized Learning Plan:');
    const planRes = await fetch(`${BASE_URL}/learningplan`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    }).then((r) => r.json());

    assert(planRes.success === true, 'Learning plan retrieved');
    assert(planRes.items?.length >= 4, `Plan contains ${planRes.items?.length} weekly milestones`);

    // 8. AI Resume Analyzer
    console.log('\n8. Testing AI Resume Analyzer:');
    const resumeFilePath = path.resolve(__dirname, '../test_alex_resume.txt');
    const fileBuffer = fs.readFileSync(resumeFilePath);
    const blob = new Blob([fileBuffer], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('resume', blob, 'test_alex_resume.txt');
    formData.append('target_career', 'Data Scientist');

    const resumeRes = await fetch(`${BASE_URL}/resume/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: formData,
    }).then((r) => r.json());

    assert(resumeRes.success === true, 'Resume analyzed successfully');
    assert(resumeRes.analysis?.overall_score >= 60, `Overall ATS Score: ${resumeRes.analysis?.overall_score}`);
    assert(resumeRes.analysis?.strengths?.length >= 2, 'Strengths detected');
    assert(resumeRes.analysis?.recommended_projects?.length >= 1, 'Recommended portfolio projects generated');

    // 9. Admin Authentication (Dr. Sarah Mitchell)
    console.log('\n9. Testing Admin Authentication:');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sarah.mitchell@university.edu', password: 'Admin123!' }),
    }).then((r) => r.json());

    assert(adminLoginRes.success === true, 'Admin login succeeded');
    assert(adminLoginRes.user?.role === 'admin', 'User role is admin');
    const adminToken = adminLoginRes.token;

    // 10. RBAC Security Check: Student accessing Admin endpoint MUST fail with 403
    console.log('\n10. Testing RBAC Security Protection:');
    const unauthorizedRes = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(unauthorizedRes.status === 403, 'Student denied access to /api/admin/stats with 403 Forbidden');

    // 11. Admin Accessing Admin Stats
    console.log('\n11. Testing Administrative Endpoints:');
    const statsRes = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((r) => r.json());

    assert(statsRes.success === true, 'Admin stats retrieved');
    assert(statsRes.stats?.totalStudents >= 2, `Total students tracked: ${statsRes.stats?.totalStudents}`);
    assert(statsRes.stats?.commonSkillGaps?.length >= 1, 'Cohort common skill gaps calculated');

    // 12. Admin Student Inspection
    const studentListRes = await fetch(`${BASE_URL}/admin/students`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((r) => r.json());

    assert(studentListRes.success === true, 'Student roster retrieved');
    assert(studentListRes.students?.length >= 2, 'Roster contains registered students');

    const firstStudentId = studentListRes.students[0].profile_id;
    const inspectRes = await fetch(`${BASE_URL}/admin/students/${firstStudentId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((r) => r.json());

    assert(inspectRes.success === true, 'Individual student dossier inspected');
    assert(inspectRes.student?.courses?.length >= 1, 'Student course records loaded in dossier');

    // Final Report
    console.log('\n=========================================================');
    console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('=========================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('💥 Test suite crashed with error:', err);
    process.exit(1);
  }
}

runTests();
