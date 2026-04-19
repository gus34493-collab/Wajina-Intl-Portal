// test_apis.js

const BASE_URL = 'http://127.0.0.1:3000/api';
let cookieHeader = '';

async function run() {
  console.log('=== WAJINA PORTAL API TESTER ===\n');

  try {
    // 1. Auth (Admin Login)
    console.log('[1] Logging in as Director...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'director@wajinaschools.com', password: 'WajinaAdmin2026!' })
    });
    
    // Extract cookies for authentication
    const setCookie = loginRes.headers.get('set-cookie');
    if (setCookie) {
      // Basic cookie parsing to pass back to the server
      const cookies = setCookie.split(',').map(c => c.split(';')[0]);
      cookieHeader = cookies.join('; ');
    }
    const loginData = await loginRes.json();
    console.log('Login Response:', loginRes.status, loginData.id ? `Success: ${loginData.name}` : loginData);

    if (!loginData.id) throw new Error('Login failed');

    // Store common data for subsequent tests
    const adminId = loginData.id;

    // 2. Classes (Create a Class)
    console.log('\n[2] Creating a Class...');
    const classRes = await fetch(`${BASE_URL}/structure/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader },
      body: JSON.stringify({ name: 'JSS 1', campus: 'SECONDARY', category: 'Junior' })
    });
    const classData = await classRes.json();
    console.log('Class Creation Response:', classRes.status, classData.id ? `Success: ${classData.name}` : classData);

    // 3. Students (List existing, or create)
    console.log('\n[3] Listing Students...');
    const studentsRes = await fetch(`${BASE_URL}/users?role=STUDENT`, {
      method: 'GET',
      headers: { 'Cookie': cookieHeader }
    });
    const studentsData = await studentsRes.json();
    console.log('Students Response:', studentsRes.status, `Found ${studentsData.total} students.`);
    
    // Check if we have the seeded student
    const student = studentsData.users.find(u => u.email === 'student.secondary@wajinaschools.com');
    let studentId = student ? student.id : null;

    if (studentId) {
      // 4. Payments (Basic)
      console.log('\n[4] Creating a Payment...');
      const payRes = await fetch(`${BASE_URL}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader },
        body: JSON.stringify({
          studentId: student.id,
          amount: 50000,
          reference: 'TEST-FEE-' + Date.now(),
          category: 'TRANSPORT',
          channel: 'POS',
          notes: 'Test Transport Fee Payment'
        })
      });
      const payData = await payRes.json();
      console.log('Payment Response:', payRes.status, payData.payment ? `Success: ${payData.payment.reference}` : payData);

      // 5. Results (Basic)
      console.log('\n[5] Fetching Results...');
      const resultsRes = await fetch(`${BASE_URL}/grades?studentId=${studentId}`, {
        method: 'GET',
        headers: { 'Cookie': cookieHeader }
      });
      const resultsData = await resultsRes.json();
      console.log('Results Response:', resultsRes.status, `Found ${resultsData.total} grades.`);
    }

    console.log('\n=== ALL TESTS COMPLETED ===');

  } catch (err) {
    console.error('\n[!] Test script encountered an error:');
    console.error('    Message:', err.message);
    if (err.cause) console.error('    Cause:', err.cause);
    if (err.stack) console.error('    Stack:', err.stack);
  }
}

run();
