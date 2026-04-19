const BASE_URL = 'http://localhost:3000/api';
let teacherCookie = '';
let studentCookie = '';

async function runTests() {
  console.log('=== ACADEMIC ENGINE VERIFICATION SUITE ===\n');

  try {
    // 1. Login as Director/Admin to set up environment
    console.log('[1] Logging in as Director...');
    const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'director@wajinaschools.com', password: 'WajinaAdmin2026!' })
    });
    const adminData = await adminLogin.json();
    const adminSetCookie = adminLogin.headers.get('set-cookie');
    if (!adminSetCookie) throw new Error(`Director login failed: ${JSON.stringify(adminData)}`);
    const adminCookie = adminSetCookie.split(';')[0];

    // 2. Test Primary School Calculation (10,10,10,10,10,50)
    console.log('\n[2] Testing Primary School Logic...');
    // We'll use the demo primary teacher and student
    const teacherLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'teacher.primary@wajinaschools.com', password: 'Teacher2026!' })
    });
    const tData = await teacherLogin.json();
    const teacherSetCookie = teacherLogin.headers.get('set-cookie');
    teacherCookie = teacherSetCookie ? teacherSetCookie.split(';')[0] : adminCookie; // fallback to admin if teacher login fails

    // Find a primary student and subject
    const pStudentRes = await fetch(`${BASE_URL}/users?role=STUDENT&campus=PRIMARY`, { headers: { 'Cookie': adminCookie } });
    const pStudents = await pStudentRes.json();
    const pStudent = pStudents.users[0];

    const pSubjectRes = await fetch(`${BASE_URL}/structure/subjects`, { headers: { 'Cookie': adminCookie } });
    const pSubjects = await pSubjectRes.json();
    const pSubject = pSubjects.subjects.find(s => s.class.campus === 'PRIMARY');

    if (pStudent && pSubject) {
      console.log(`    Testing Primary: Student ${pStudent.name}, Subject ${pSubject.name}`);
      const upsertRes = await fetch(`${BASE_URL}/grades/upsert`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Cookie': teacherCookie },
        body: JSON.stringify({
          studentId: pStudent.id,
          subjectId: pSubject.id,
          firstCA: 10, secondCA: 10, thirdCA: 10, fourthCA: 10, fifthCA: 10, exam: 45
        })
      });
      const gradeData = await upsertRes.json();
      console.log(`    Result: Total=${gradeData.total}, Grade=${gradeData.grade} (Expected: 95, A)`);
      if (gradeData.total === 95) console.log('    ✅ Primary Calculation Success');
      else console.error('    ❌ Primary Calculation Failed');
    }

    // 3. Test Junior Secondary Calculation (15,15,10,60)
    console.log('\n[3] Testing Junior Secondary Logic...');
    const jStudentRes = await fetch(`${BASE_URL}/users?email=student.junior@wajinaschools.com`, { headers: { 'Cookie': adminCookie } });
    const { users: jUsers } = await jStudentRes.json();
    const jStudent = jUsers[0];

    const jSubjectRes = await fetch(`${BASE_URL}/structure/subjects`, { headers: { 'Cookie': adminCookie } });
    const { subjects: jSubjects } = await jSubjectRes.json();
    const jSubject = jSubjects.find(s => s.name.includes('Junior'));

    if (jStudent && jSubject) {
      console.log(`    Testing Junior: Student ${jStudent.name}, Subject ${jSubject.name}`);
      const upsertRes = await fetch(`${BASE_URL}/grades/upsert`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
        body: JSON.stringify({
          studentId: jStudent.id,
          subjectId: jSubject.id,
          firstCA: 15, secondCA: 15, thirdCA: 10, exam: 50
        })
      });
      const gradeData = await upsertRes.json();
      console.log(`    Result: Total=${gradeData.total}, Grade=${gradeData.grade} (Expected: 90, A)`);
      if (gradeData.total === 90) console.log('    ✅ Junior Secondary Success');
      else console.error('    ❌ Junior Secondary Failed');
    }

    // 3.5 Test Senior Secondary Calculation (10,10,10,70)
    console.log('\n[3.5] Testing Senior Secondary Logic...');
    const sStudentRes = await fetch(`${BASE_URL}/users?email=student.senior@wajinaschools.com`, { headers: { 'Cookie': adminCookie } });
    const { users: sUsers } = await sStudentRes.json();
    const sStudent = sUsers[0];

    const sSubjectRes = await fetch(`${BASE_URL}/structure/subjects`, { headers: { 'Cookie': adminCookie } });
    const { subjects: sSubjects } = await sSubjectRes.json();
    const sSubject = sSubjects.find(s => s.name.includes('Senior'));

    if (sStudent && sSubject) {
      console.log(`    Testing Senior: Student ${sStudent.name}, Subject ${sSubject.name}`);
      const upsertRes = await fetch(`${BASE_URL}/grades/upsert`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
        body: JSON.stringify({
          studentId: sStudent.id,
          subjectId: sSubject.id,
          firstCA: 10, secondCA: 10, thirdCA: 10, exam: 60
        })
      });
      const gradeData = await upsertRes.json();
      console.log(`    Result: Total=${gradeData.total}, Grade=${gradeData.grade} (Expected: 90, A1)`);
      if (gradeData.total === 90 && gradeData.grade === 'A1') console.log('    ✅ Senior Secondary Success');
      else console.error(`    ❌ Senior Secondary Failed (Got Grade: ${gradeData.grade})`);
    }

    // 4. Test Debt Blocking
    console.log('\n[4] Testing Debt Blocking...');
    const studentLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student.junior@wajinaschools.com', password: 'Student2026!' })
    });
    const studentSetCookie = studentLogin.headers.get('set-cookie');
    if (!studentSetCookie) throw new Error(`Student login failed: ${await studentLogin.text()}`);
    studentCookie = studentSetCookie.split(';')[0];

    console.log('    Attempting to fetch grades as student (expected block if no successful tuition payment)...');
    const resRes = await fetch(`${BASE_URL}/grades`, { headers: { 'Cookie': studentCookie } });
    const resData = await resRes.json();

    if (resRes.status === 403) {
      console.log(`    ✅ Debt Block Active: ${resData.error || resData.message}`);
    } else {
      console.error(`    ❌ Debt Block FAILED (Status ${resRes.status})`);
    }

    console.log('\n[5] Testing Fee Balance Logic...');

    // A. Set ₦100,000 target
    console.log('    A. Setting ₦100,000 target for Secondary Campus via Director...');
    const currentSession = await fetch(`${BASE_URL}/structure/sessions`, { headers: { 'Cookie': adminCookie } }).then(r => r.json());
    const targetSessionId = currentSession.find(s => s.isCurrent)?.id || currentSession[0].id;
    const currentTerm = await fetch(`${BASE_URL}/structure/terms`, { headers: { 'Cookie': adminCookie } }).then(r => r.json());
    const targetTermId = currentTerm.find(t => t.isCurrent)?.id || currentTerm[0].id;

    await fetch(`${BASE_URL}/finance/fees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({
        category: 'TUITION',
        amount: 100000,
        campus: 'SECONDARY',
        termId: targetTermId,
        sessionId: targetSessionId
      })
    });

    // B. Re-Login as Senior Student to get fresh balance
    console.log('    B. Posting partial ₦40,000 tuition for Senior Student...');
    const sLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student.senior@wajinaschools.com', password: 'Student2026!' })
    });
    const sSetCookie = sLogin.headers.get('set-cookie');
    if (!sSetCookie) throw new Error(`Senior student login failed: ${await sLogin.text()}`);
    const sCookie = sSetCookie.split(';')[0];
    const sData = await sLogin.json();

    await fetch(`${BASE_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({
        studentId: sData.id,
        amount: 40000,
        reference: 'TEST-PARTIAL-' + Date.now(),
        category: 'TUITION',
        termId: targetTermId
      })
    });

    // C. Checking access (Expected: BLOCKED)
    console.log('    C. Checking access (Expected: BLOCKED)...');
    const check1 = await fetch(`${BASE_URL}/grades?termId=${targetTermId}`, { headers: { 'Cookie': sCookie } });
    if (check1.status === 403) {
      console.log('    ✅ Access correctly blocked for partial payment');
    } else {
      console.error('    ❌ Access INCORRECTLY allowed for partial payment (Status ' + check1.status + ')');
    }

    // D. Post remainder
    console.log('    D. Posting remainder ₦60,000 tuition...');
    await fetch(`${BASE_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({
        studentId: sData.id,
        amount: 60000,
        reference: 'TEST-FULL-' + Date.now(),
        category: 'TUITION',
        termId: targetTermId
      })
    });

    // E. Checking access (Expected: ALLOWED)
    console.log('    E. Checking access (Expected: ALLOWED)...');
    const check2 = await fetch(`${BASE_URL}/grades?termId=${targetTermId}`, { headers: { 'Cookie': sCookie } });
    if (check2.status === 200) {
      console.log('    ✅ Access correctly allowed for full payment');
    } else {
      console.error('    ❌ Access INCORRECTLY blocked for full payment (Status ' + check2.status + ')');
    }

    console.log('\n=== VERIFICATION COMPLETE ===');

  } catch (err) {
    console.error('Test Error:', err);
  }
}

runTests();
