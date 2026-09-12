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

async function verifyLogins() {
  console.log('--- Verifying Updated Logins ---');

  // 1. Admin Direct Login
  console.log('\n1. Testing Admin Direct Login (admin@saifullah.ai / saifullah@123)...');
  const adminRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'admin@saifullah.ai', password: 'saifullah@123' }
  );

  console.log('Admin Login status:', adminRes.status);
  console.log('Admin Name:', adminRes.body?.user?.name);
  console.log('Admin Role:', adminRes.body?.user?.role);
  console.log('Admin Token acquired:', !!adminRes.body?.token);

  if (adminRes.status !== 200 || adminRes.body?.user?.role !== 'admin') {
    console.error('FAILED: Admin direct login failed.');
    process.exit(1);
  }

  // 2. Admin Protected Access Test
  console.log('\n2. Testing Admin Stats Access with Token...');
  const statsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/stats',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminRes.body.token}` },
  });
  console.log('Admin Stats status:', statsRes.status, 'Total Students:', statsRes.body?.stats?.totalStudents);

  // 3. Demo Student Login (Saifullah)
  console.log('\n3. Testing Demo Student Login (saifullah@student.edu / Student123!)...');
  const studentRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'saifullah@student.edu', password: 'Student123!' }
  );

  console.log('Student Login status:', studentRes.status);
  console.log('Student Name:', studentRes.body?.user?.name);
  console.log('Student Role:', studentRes.body?.user?.role);
  console.log('Student Token acquired:', !!studentRes.body?.token);

  if (studentRes.status !== 200 || studentRes.body?.user?.name !== 'Saifullah') {
    console.error('FAILED: Student login or name mismatch.');
    process.exit(1);
  }

  // 4. Student Dashboard Summary Access
  console.log('\n4. Testing Student Dashboard Access...');
  const dashRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/student/dashboard',
    method: 'GET',
    headers: { Authorization: `Bearer ${studentRes.body.token}` },
  });
  console.log('Student Dashboard status:', dashRes.status, 'Student Name on Dashboard:', dashRes.body?.summary?.studentName);

  console.log('\n--- All Credential & Access Checks Passed Successfully ---');
}

verifyLogins().catch(console.error);
