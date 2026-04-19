(function () {
    'use strict';

    const apiFetch = window.Wajina.apiFetch;
    const esc = window.Wajina.DOMUtils.escapeHTML;

    let currentSubject = null;
    let students = [];
    let config = null;
    let pendingChanges = new Map();
    let saveTimeout = null;

    async function init(e) {
        // const user = e.detail.user;
        
        try {
            const data = await apiFetch('/api/structure/subjects');
            if (!data) return;
            
            const selector = document.getElementById('subjectArmSelector');
            if (selector) {
                window.Wajina.setSafeHTML(selector, '<option value="">Select a class to begin...</option>');
                
                data.subjects.forEach(sub => {
                    const opt = document.createElement('option');
                    opt.value = JSON.stringify({ 
                        subjectId: sub.id, 
                        classId: sub.classId, 
                        campus: sub.class.campus, 
                        cat: sub.class.category, 
                        className: sub.class.name, 
                        subjectName: sub.name 
                    });
                    opt.textContent = `${sub.class.name} - ${sub.name}`;
                    selector.appendChild(opt);
                });

                selector.onchange = (e) => {
                    if (e.target.value) {
                        loadGrid(JSON.parse(e.target.value));
                    }
                };
            }
        } catch (err) { console.error('Subject Load Failed', err); }
    }

    async function loadGrid(subConfig) {
        currentSubject = subConfig;
        const targetContext = document.getElementById('targetContext');
        if (targetContext) targetContext.textContent = `${subConfig.subjectName} | ${subConfig.className}`;
        
        try {
            // Default config for Primary/Secondary
            config = subConfig.campus === 'PRIMARY' ? 
                { labels: ['CA 1', 'CA 2', 'CA 3', 'CA 4', 'CA 5', 'Exams'], keys: ['firstCA','secondCA','thirdCA','fourthCA','fifthCA','exam'], max: [10,10,10,10,10,50] } :
                { labels: ['CA 1', 'CA 2', 'CA 3', 'Exams'], keys: ['firstCA','secondCA','thirdCA','exam'], max: [10,10,10,70] };

            // Fetch Students
            const data = await apiFetch(`/api/users?role=STUDENT&classId=${subConfig.classId}`);
            students = data.users || [];
            renderGrid();
        } catch (err) {
            const body = document.getElementById('gridBody');
            if (body) window.Wajina.setSafeHTML(body, '<tr><td colspan="10" style="padding: 2rem; text-align:center; color:#e74c3c; font-weight:700;">Academic Relay Offline.</td></tr>');
        }
    }

    function renderGrid() {
        const headerRow = document.getElementById('gridHeader');
        if (!headerRow) return;

        let headerHtml = '<th class="sticky-col">Student Name</th>';
        config.labels.forEach((l, i) => {
            headerHtml += `<th>${l} (${config.max[i]})</th>`;
        });
        headerHtml += '<th>Total</th><th>Grade</th>';
        window.Wajina.setSafeHTML(headerRow, headerHtml);

        const body = document.getElementById('gridBody');
        if (!body) return;
        
        // Clearing previous items
        window.Wajina.setSafeHTML(body, '');
        
        students.forEach(student => {
            const tr = document.createElement('tr');
            
            let rowHtml = `<td class="sticky-col">
                <div style="font-weight: 700; color: var(--brand-gunmetal);">${esc(student.name)}</div>
                <div style="font-size: 0.65rem; color: var(--text-muted); font-weight:600;">${esc(student.id)}</div>
            </td>`;
            
            config.keys.forEach((key, i) => {
                rowHtml += `<td><input type="number" step="0.5" 
                    class="grade-cell"
                    data-action="cellChange"
                    data-student="${esc(student.id)}"
                    data-key="${esc(key)}"
                    max="${esc(config.max[i])}" 
                    placeholder="0"></td>`;
            });

            rowHtml += `<td><span id="total-${student.id}" style="font-weight:800; color:var(--brand-moonstone);">0</span></td>`;
            rowHtml += `<td><span id="grade-${student.id}" style="font-weight:800; color:var(--brand-gunmetal);">-</span></td>`;
            
            window.Wajina.setSafeHTML(tr, rowHtml);
            body.appendChild(tr);
        });
    }

    function onCellChange(studentId, key, value) {
        if (!pendingChanges.has(studentId)) pendingChanges.set(studentId, { studentId });
        pendingChanges.get(studentId)[key] = parseFloat(value) || 0;

        const calcToggle = document.getElementById('realTimeCalcToggle');
        if (calcToggle && calcToggle.checked) {
            calculateRow(studentId);
        }

        const autoSaveToggle = document.getElementById('autoSaveToggle');
        if (autoSaveToggle && autoSaveToggle.checked) {
            triggerDebouncedSave();
        }
    }

    function calculateRow(studentId) {
        const data = pendingChanges.get(studentId) || {};
        let total = 0;
        config.keys.forEach(k => total += (data[k] || 0));
        
        const totalEl = document.getElementById(`total-${studentId}`);
        const gradeEl = document.getElementById(`grade-${studentId}`);
        
        if (totalEl) totalEl.textContent = total;
        const grade = total >= 75 ? 'A' : total >= 65 ? 'B' : total >= 55 ? 'C' : total >= 45 ? 'D' : total >= 40 ? 'E' : 'F';
        if (gradeEl) gradeEl.textContent = grade;
    }

    function triggerDebouncedSave() {
        showStatus('Changes pending...', false);
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveBatch, 1500);
    }

    async function saveBatch() {
        if (pendingChanges.size === 0) return;
        showStatus('Synchronizing...', false);
        const gradesArray = Array.from(pendingChanges.values());
        
        try {
            await apiFetch('/api/grades/bulk', {
                method: 'POST',
                body: JSON.stringify({
                    subjectId: currentSubject.subjectId,
                    termId: 'current',
                    grades: gradesArray
                })
            });

            pendingChanges.clear();
            showStatus('Changes Persisted', true);
        } catch (err) {
            showStatus(`Sync Failed: ${err.message}`, false, true);
        }
    }

    function showStatus(text, success = false, error = false) {
        const el = document.getElementById('syncStatus');
        const txt = document.getElementById('statusText');
        if (!el || !txt) return;
        el.style.display = 'flex';
        txt.textContent = text;
        
        if (error) {
            el.style.background = '#e74c3c';
            window.Wajina.setSafeHTML(el, `<i class="fa-solid fa-triangle-exclamation"></i> <span>${esc(text)}</span>`);
        } else if (success) {
            el.style.background = '#2ecc71';
            window.Wajina.setSafeHTML(el, `<i class="fa-solid fa-circle-check"></i> <span>${esc(text)}</span>`);
            setTimeout(() => el.style.display = 'none', 3000);
        } else {
            el.style.background = 'var(--brand-gunmetal)';
            window.Wajina.setSafeHTML(el, `<i class="fa-solid fa-rotate-right fa-spin"></i> <span>${esc(text)}</span>`);
        }
    }

    function handleNav(e) {
        const input = e.target;
        const td = input.parentElement;
        const tr = td.parentElement;
        const colIndex = Array.from(tr.children).indexOf(td);

        if (e.key === 'ArrowDown' || e.key === 'Enter') {
            e.preventDefault();
            tr.nextElementSibling?.children[colIndex].querySelector('input')?.focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            tr.previousElementSibling?.children[colIndex].querySelector('input')?.focus();
        } else if (e.key === 'ArrowRight' && input.selectionEnd === input.value.length) {
            td.nextElementSibling?.querySelector('input')?.focus();
        } else if (e.key === 'ArrowLeft' && input.selectionStart === 0) {
            td.previousElementSibling?.querySelector('input')?.focus();
        }
    }

    window.addEventListener('authReady', init);

    document.addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        if (action === 'saveBatch') saveBatch();
        if (action === 'toggleSidebar') {
            const layout = document.getElementById('dashboardLayout');
            if (layout) layout.classList.toggle('sidebar-open');
        }
    });

    document.addEventListener('input', e => {
        if (e.target.matches('[data-action="cellChange"]')) {
            onCellChange(e.target.getAttribute('data-student'), e.target.getAttribute('data-key'), e.target.value);
        }
    });

    document.addEventListener('keydown', e => {
        if (e.target.matches('.grade-cell')) handleNav(e);
    });
})();
