import http from 'http';

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting EduMentor AI Automated Verification Suite ---');

  // 1. Student Login
  console.log('\n1. Testing Student Login...');
  const studentLoginRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'alex@student.edu', password: 'Student123!' }
  );
  const studentToken = studentLoginRes.body?.token;
  console.log('Student Login status:', studentLoginRes.status, 'Token acquired:', !!studentToken);

  if (!studentToken) {
    console.error('Failed to log in as student:', studentLoginRes.body);
    process.exit(1);
  }

  // 2. Admin Login
  console.log('\n2. Testing Admin Login...');
  const adminLoginRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'sarah.mitchell@university.edu', password: 'Admin123!' }
  );
  const adminToken = adminLoginRes.body?.token;
  console.log('Admin Login status:', adminLoginRes.status, 'Token acquired:', !!adminToken);

  // 3. Test GPA & Graduation Year Validations
  console.log('\n3. Testing Student Profile Validations...');
  // Invalid GPA: 11.5
  const invalidGpaRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/student/profile',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
    },
    { gpa: 11.5 }
  );
  console.log('Invalid GPA (11.5) rejected with status:', invalidGpaRes.status, invalidGpaRes.body?.message);

  // Invalid Grad Year: 2018
  const invalidYearRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/student/profile',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
    },
    { graduation_year: 2018 }
  );
  console.log('Invalid Grad Year (2018) rejected with status:', invalidYearRes.status, invalidYearRes.body?.message);

  // Valid Profile Update: GPA 8.75, Grad Year 2026, Progress 85
  const validProfileRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/student/profile',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
    },
    {
      gpa: 8.75,
      graduation_year: 2026,
      academic_progress: 85,
    }
  );
  console.log(
    'Valid Profile Update status:',
    validProfileRes.status,
    'Updated GPA:',
    validProfileRes.body?.profile?.gpa,
    'Grad Year:',
    validProfileRes.body?.profile?.graduation_year
  );

  // 4. Test 12-Week Learning Plan Generation
  console.log('\n4. Testing 12-Week Learning Plan Generation...');
  const planRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/learning-plan/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
    },
    {
      target_career: 'AI/ML Engineer',
      timeframe_weeks: 12,
      hours_per_week: 15,
    }
  );
  console.log(
    'Learning Plan Generation status:',
    planRes.status,
    'Items generated count:',
    planRes.body?.items?.length,
    'Timeframe weeks:',
    planRes.body?.plan?.timeframe_weeks,
    'Hours/week:',
    planRes.body?.plan?.hours_per_week
  );

  // 5. Test Admin Career Deletion Dependency Protection
  if (adminToken) {
    console.log('\n5. Testing Admin Career Deletion Dependency Protection...');
    // Target Career 1 is targeted by students
    const deleteRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/careers/1',
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    console.log(
      'Admin Career 1 Deletion response status:',
      deleteRes.status,
      '(Expected 409 Conflict):',
      deleteRes.body?.message
    );
  }

  // 6. Test Human Advisor Consultation Ticket Dispatch
  console.log('\n6. Testing Support / Consultation Ticket Dispatch...');
  const supportRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/support/request',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
    },
    {
      name: 'Alex Test',
      email: 'student@edumentor.edu',
      topic: 'Graduation Credit Audit & Course Planning',
      message: 'Requesting review of completed prerequisite credits for Machine Learning elective.',
    }
  );
  console.log(
    'Support ticket status:',
    supportRes.status,
    'Ticket ID:',
    supportRes.body?.ticketId,
    supportRes.body?.message
  );

  console.log('\n--- All Automated Backend Validations Finished ---');
}

runTests().catch(console.error);
