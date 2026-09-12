import http from 'http';
import fs from 'fs';
import path from 'path';

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
      req.write(postData);
    }
    req.end();
  });
}

function buildMultipartFormData(fields, fileField) {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  let payload = '';

  for (const [key, val] of Object.entries(fields)) {
    payload += `--${boundary}\r\n`;
    payload += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
    payload += `${val}\r\n`;
  }

  payload += `--${boundary}\r\n`;
  payload += `Content-Disposition: form-data; name="${fileField.name}"; filename="${fileField.filename}"\r\n`;
  payload += `Content-Type: ${fileField.contentType}\r\n\r\n`;
  payload += `${fileField.content}\r\n`;
  payload += `--${boundary}--\r\n`;

  return {
    boundary,
    body: Buffer.from(payload),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

async function runResumeTests() {
  console.log('--- Testing Multi-Signal Resume Verification ---');

  // 1. Student Login
  const loginRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    JSON.stringify({ email: 'alex@student.edu', password: 'Student123!' })
  );
  const token = loginRes.body?.token;

  // 2. Test Non-Resume (Declaration Form)
  console.log('\n2. Testing Non-Resume (Self-Declaration Form)...');
  const declarationText = `
    SELF DECLARATION FORM
    I hereby declare that all the information furnished above is true and correct to the best of my knowledge and belief.
    In case any of the above information is found to be false or untrue or misleading or misrepresenting, I am aware that I may be held liable for it.
    Signature: John Doe
    Date: 01/01/2025
    Place: Springfield
  `;

  const invalidMultipart = buildMultipartFormData(
    { target_career: 'Data Scientist' },
    {
      name: 'resume',
      filename: 'declaration_form.txt',
      contentType: 'text/plain',
      content: declarationText,
    }
  );

  const invalidRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/resume/upload',
      method: 'POST',
      headers: {
        'Content-Type': invalidMultipart.contentType,
        'Content-Length': invalidMultipart.body.length,
        Authorization: `Bearer ${token}`,
      },
    },
    invalidMultipart.body
  );

  console.log('Non-resume status:', invalidRes.status);
  console.log('Score:', invalidRes.body?.analysis?.overall_score, '(Expected: 0)');
  console.log('Is valid resume:', invalidRes.body?.analysis?.is_valid_resume, '(Expected: false)');
  console.log('Summary:', invalidRes.body?.analysis?.summary?.slice(0, 120) + '...');

  // 3. Test Legitimate Professional Resume
  console.log('\n3. Testing Legitimate Comprehensive Resume...');
  const resumeText = `
    Alex Johnson
    Email: alex.johnson@university.edu | Phone: (555) 019-2834 | GitHub: github.com/alexj | LinkedIn: linkedin.com/in/alexj
    
    PROFESSIONAL SUMMARY
    Dedicated Computer Science student with a strong background in Python, SQL, and predictive machine learning. Proven ability to build full-stack data analytics platforms and optimize complex database queries.
    
    EDUCATION
    Bachelor of Science in Computer Science
    Metropolitan State University | Cumulative GPA: 8.75 / 10.0 | Expected Graduation: May 2026
    Relevant Coursework: Data Structures & Algorithms, Database Management Systems, Machine Learning Fundamentals, Probability & Statistics.
    
    WORK EXPERIENCE
    Software Engineering Intern | DataTech Solutions | June 2025 – August 2025
    • Developed automated ETL data pipelines in Python and PostgreSQL processing over 500,000 daily transaction records.
    • Built REST APIs with Node.js and Express that reduced query latency by 35%.
    • Collaborated in an agile scrum team of 8 engineers utilizing Git, Docker, and Jira.
    
    PROJECTS
    Predictive Customer Churn Model | Python, Scikit-Learn, Pandas
    • Trained Random Forest and XGBoost classification models achieving an 89% ROC-AUC score on customer retention data.
    • Created interactive visualizations using Seaborn and deployed predictions via a Streamlit web app.
    
    TECHNICAL SKILLS
    • Languages & Frameworks: Python, SQL, JavaScript, React, Node.js, HTML/CSS
    • Tools & Databases: PostgreSQL, SQLite, Git, Docker, Scikit-Learn, Pandas, NumPy
  `;

  const validMultipart = buildMultipartFormData(
    { target_career: 'Data Scientist' },
    {
      name: 'resume',
      filename: 'alex_johnson_resume.txt',
      contentType: 'text/plain',
      content: resumeText,
    }
  );

  const validRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/resume/upload',
      method: 'POST',
      headers: {
        'Content-Type': validMultipart.contentType,
        'Content-Length': validMultipart.body.length,
        Authorization: `Bearer ${token}`,
      },
    },
    validMultipart.body
  );

  console.log('Valid resume status:', validRes.status);
  console.log('Score:', validRes.body?.analysis?.overall_score, '(Expected: > 70)');
  console.log('Career Alignment:', validRes.body?.analysis?.career_alignment_score);
  console.log('Strengths count:', validRes.body?.analysis?.strengths?.length);
  console.log('Strengths sample:', validRes.body?.analysis?.strengths?.[0]);

  console.log('\n--- Resume Verification Tests Complete ---');
}

runResumeTests().catch(console.error);
