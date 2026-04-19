const API_BASE = 'http://localhost:3001/api';

async function testRoutes() {
    const routes = [
        '/grades/pending-review',
        '/structure/sessions',
        '/structure/classes',
        '/analytics/academics',
        '/analytics/alerts'
    ];

    console.log('--- Verifying API Endpoints ---');
    for (const r of routes) {
        try {
            const res = await fetch(`${API_BASE}${r}`);
            if (res.status === 401) {
                console.log(`[PASS] ${r}: HTTP 401 (Unauthorized as expected)`);
            } else if (res.status === 404) {
                console.log(`[FAIL] ${r}: HTTP 404 (Route NOT found)`);
            } else {
                console.log(`[WARN] ${r}: HTTP ${res.status}`);
            }
        } catch (err) {
            console.log(`[FAIL] ${r}: ${err.message}`);
        }
    }
}

testRoutes();
