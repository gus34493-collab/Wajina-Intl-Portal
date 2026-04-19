// Using native fetch (Node 18+)

async function testCsrf() {
    const baseUrl = 'http://localhost:3000/api/complaints';
    
    console.log('--- Testing CSRF Protection ---');

    // 1. Test POST without token
    console.log('\n[Test 1] POST without x-csrf-token header:');
    try {
        const res1 = await fetch(baseUrl, {
            method: 'POST',
            body: JSON.stringify({ subject: 'Test', message: 'Hello', targetRole: 'TEACHER', studentId: '1' }),
            headers: { 'Content-Type': 'application/json' }
        });
        console.log(`Status: ${res1.status} - ${res1.statusText}`);
        const data1 = await res1.json();
        console.log('Response:', data1);
    } catch (e) {
        console.error('Error:', e.message);
    }

    // 2. Test POST with INVALID token
    console.log('\n[Test 2] POST with invalid x-csrf-token header:');
    try {
        const res2 = await fetch(baseUrl, {
            method: 'POST',
            body: JSON.stringify({ subject: 'Test', message: 'Hello', targetRole: 'TEACHER', studentId: '1' }),
            headers: { 
                'Content-Type': 'application/json',
                'x-csrf-token': 'invalid-token-123'
            }
        });
        console.log(`Status: ${res2.status} - ${res2.statusText}`);
        const data2 = await res2.json();
        console.log('Response:', data2);
    } catch (e) {
        console.error('Error:', e.message);
    }
}

testCsrf();
