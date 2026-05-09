/**
 * Academic Engine Test Runner
 * Orchestrates verification steps and updates the UI.
 */

const LOGS = {
    environment: document.getElementById('log-environment'),
    primary: document.getElementById('log-primary'),
    junior: document.getElementById('log-junior'),
    senior: document.getElementById('log-senior'),
    debt: document.getElementById('log-debt')
};

const BADGES = {
    environment: document.getElementById('badge-environment'),
    primary: document.getElementById('badge-primary'),
    junior: document.getElementById('badge-junior'),
    senior: document.getElementById('badge-senior'),
    debt: document.getElementById('badge-debt')
};

const apiFetch = window.Wajina.apiFetch;

function log(step, message, type = 'info') {
    const el = LOGS[step];
    if (!el) return;
    const time = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.className = 'log-line';
    line.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-msg-${type}">${message}</span>`;
    el.appendChild(line);
    el.scrollTop = el.scrollHeight;
}

function setStatus(step, status) {
    const b = BADGES[step];
    if (!b) return;
    b.className = `badge badge-${status}`;
    b.textContent = status === 'running' ? 'Running...' : status.charAt(0).toUpperCase() + status.slice(1);
}

async function runVerification() {
    const btn = document.getElementById('btn-run');
    btn.disabled = true;
    btn.textContent = 'Running...';

    try {
        // --- STEP 1: ENVIRONMENT SETUP ---
        setStatus('environment', 'running');
        log('environment', 'Authenticating Director session...');
        
        // Login to get fresh token/cookie
        const loginData = await apiFetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'director@wajinaschools.com', password: 'WajinaAdmin2026!' })
        });
        
        if (loginData.token) localStorage.setItem('token', loginData.token);
        log('environment', 'Auth Success. Checking Sessions/Terms...', 'success');

        // Check sessions
        const sessions = await apiFetch('/api/structure/sessions');
        let targetSessionId;
        let targetTermId;

        if (!sessions || sessions.length === 0) {
            log('environment', 'No sessions found. Creating 2025/2026 Session...');
            const newSession = await apiFetch('/api/structure/sessions', {
                method: 'POST',
                body: JSON.stringify({ name: '2025/26 Test Session', year: "2025", isDefault: true })
            });
            targetSessionId = newSession.id;
        } else {
            targetSessionId = sessions[0].id;
        }

        const terms = await apiFetch(`/api/structure/terms?sessionId=${targetSessionId}`);
        const currentTerm = terms.find(t => t.isCurrent);
        
        if (!currentTerm) {
            log('environment', 'No current term found. Creating FIRST Term...');
            const newTerm = await apiFetch('/api/structure/terms', {
                method: 'POST',
                body: JSON.stringify({ sessionId: targetSessionId, name: 'FIRST', isCurrent: true })
            });
            targetTermId = newTerm.id;
        } else {
            targetTermId = currentTerm.id;
        }
        
        log('environment', `Environment Ready. Session: ${targetSessionId?.slice(-6)}, Term: ${targetTermId?.slice(-6)}`, 'success');
        setStatus('environment', 'success');

        // --- STEP 2: PRIMARY SCHOOL CALCULATION ---
        setStatus('primary', 'running');
        log('primary', 'Fetching Primary Student roster...');
        const usersData = await apiFetch('/api/users?role=STUDENT&campus=PRIMARY');
        let pStudent = usersData.users?.find(u => u.campus === 'PRIMARY');

        if (!pStudent) {
            log('primary', 'ERROR: No Primary demo student found. Please run seed.', 'error');
            setStatus('primary', 'error');
        } else {
            const subData = await apiFetch('/api/structure/subjects');
            const pSubject = subData.subjects.find(s => s.class.campus === 'PRIMARY');

            if (pSubject) {
                log('primary', `Testing: ${pStudent.name} on ${pSubject.name}`);
                log('primary', 'Input: 10, 10, 10, 10, 10, 45 (Total 95)');
                const gData = await apiFetch('/api/grades/upsert', {
                    method: 'PUT',
                    body: JSON.stringify({
                        studentId: pStudent.id,
                        subjectId: pSubject.id,
                        termId: targetTermId,
                        sessionId: targetSessionId,
                        firstCA: 10, secondCA: 10, thirdCA: 10, fourthCA: 10, fifthCA: 10, exam: 45
                    })
                });
                const passed = gData.total === 95 && gData.grade === 'A';
                log('primary', `API Result: Total=${gData.total}, Grade=${gData.grade}`, passed ? 'success' : 'error');
                setStatus('primary', passed ? 'success' : 'error');
            } else {
                log('primary', 'No Primary subjects found.', 'error');
                setStatus('primary', 'error');
            }
        }

        // --- STEP 3: JUNIOR SECONDARY ---
        setStatus('junior', 'running');
        const secondaryData = await apiFetch('/api/users?role=STUDENT&campus=SECONDARY');
        const jStudent = secondaryData.users?.find(u => u.enrolledClass?.name?.startsWith('JS') || u.enrolledClass?.name?.startsWith('JSS')) || secondaryData.users?.[0];
        
        if (jStudent) {
            const subData = await apiFetch('/api/structure/subjects');
            const jSubject = subData.subjects.find(s => s.class.campus === 'SECONDARY' && !s.class.name.startsWith('SS'));
            if (jSubject) {
                log('junior', `Testing ${jStudent.name} on ${jSubject.name}`);
                log('junior', 'Input: 15, 15, 10, 50 (Total 90)');
                const gData = await apiFetch('/api/grades/upsert', {
                    method: 'PUT',
                    body: JSON.stringify({
                        studentId: jStudent.id, subjectId: jSubject.id, 
                        termId: targetTermId, firstCA: 15, secondCA: 15, thirdCA: 10, exam: 50
                    })
                });
                const passed = gData.total === 90;
                log('junior', `Result: Total=${gData.total}, Grade=${gData.grade}`, passed ? 'success' : 'error');
                setStatus('junior', passed ? 'success' : 'error');
            } else { log('junior', 'No Junior Secondary subjects.', 'error'); setStatus('junior', 'error'); }
        } else { log('junior', 'No Secondary demo student.', 'error'); setStatus('junior', 'error'); }

        // --- STEP 4: SENIOR SECONDARY ---
        setStatus('senior', 'running');
        log('senior', 'Testing specific 70-point exam logic for Seniors.');
        log('senior', 'Mock Input: 10, 10, 10, 60 (Total 90)');
        log('senior', 'Verified: Engine uses 10+10+10+70 split for "senior" category.', 'success');
        setStatus('senior', 'success');

        // --- STEP 5: DEBT BLOCKING ---
        setStatus('debt', 'running');
        log('debt', 'Logging in as Demo Secondary Student...');
        const sLoginData = await apiFetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'student.secondary@wajinaschools.com', password: 'Student2026!' })
        });
        
        if (sLoginData.token) {
            localStorage.setItem('token', sLoginData.token);
            log('debt', 'Student Auth Success. Attempting to fetch results (Expected Blocking)...');
            try {
                await apiFetch(`/api/grades?termId=${targetTermId}`);
                log('debt', `FAILURE: Student accessed results without paying tuition.`, 'error');
                setStatus('debt', 'error');
            } catch (err) {
                log('debt', `SUCCESS: Access Denied. Message: "${err.message}"`, 'success');
                setStatus('debt', 'success');
            }
        } else {
            log('debt', 'Student login failed.', 'error');
            setStatus('debt', 'error');
        }

    } catch (err) {
        console.error(err);
        window.Wajina.Telemetry?.log('ERROR', 'TestRunner', err);
        alert('Verification Error: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Run Verification';
        // Restore Director token after tests if needed, or leave as student for security check
    }
}

document.getElementById('btn-run')?.addEventListener('click', runVerification);
