(function () {
    'use strict';

    const apiFetch = window.Wajina.apiFetch;
    const esc = window.Wajina.DOMUtils.escapeHTML;
    
    let myWards = [];
    let myComplaints = [];

    /**
     * Component Initialization
     */
    async function initDashboard(e) {
        try {
            // Parallel fetch for speed
            const [dashRes, complaintsRes] = await Promise.all([
                apiFetch('/api/parent/dashboard'),
                apiFetch('/api/complaints')
            ]);

            myWards = dashRes?.wards || [];
            myComplaints = complaintsRes || [];

            updateGlobalUI();
            renderStats();
            renderWards();
            renderCampusModule();
            renderComplaints();
            renderAnnouncements();

        } catch (err) {
            console.error('[ParentDashboard] Initialization Error:', err);
            window.Wajina.Toast.show('Failed to sync portal data. Please refresh.');
        }
    }

    /**
     * UI Updates
     */
    function updateGlobalUI() {
        const welcome = document.getElementById('welcomeUser');
        if (welcome && window.currentUser) {
            welcome.textContent = `Welcome, ${window.currentUser.name.split(' ')[0]}`;
        }
    }

    function renderStats() {
        const statEnrolled = document.getElementById('statEnrolled');
        const statAttendance = document.getElementById('statMiddleValue');
        const statFeesStatus = document.getElementById('statFeesStatus');
        const statFeesCount = document.getElementById('statFeesCount');

        if (statEnrolled) statEnrolled.textContent = myWards.length;

        // Attendance Stats
        const totalAtt = myWards.reduce((s, w) => s + (w.attendanceRate || 0), 0);
        const avgAtt = myWards.length ? (totalAtt / myWards.length).toFixed(1) : 0;
        if (statAttendance) statAttendance.textContent = `${avgAtt}%`;

        // Fees Stats
        const unpaidCount = myWards.filter(w => !w.hasPaid).length;
        if (statFeesStatus) {
            statFeesStatus.textContent = unpaidCount === 0 ? 'Cleared' : 'Attention';
            statFeesStatus.style.color = unpaidCount === 0 ? 'var(--brand-moonstone)' : 'var(--brand-saffron)';
        }
        if (statFeesCount) {
            statFeesCount.textContent = unpaidCount === 0 ? 'All fees settled' : `${unpaidCount} children pending`;
        }
    }

    function renderWards() {
        const grid = document.getElementById('childrenGrid');
        if (!grid) return;

        if (myWards.length === 0) {
            window.Wajina.setSafeHTML(grid, '<div class="card" style="grid-column: span 2; text-align: center; color: var(--text-muted); padding: 4rem;">No children linked to your account yet. Contact Registry.</div>');
            return;
        }

        const html = myWards.map(w => {
            const campusClass = w.campus === 'SECONDARY' ? 'campus-secondary' : 'campus-primary';
            const campusLabel = w.campus || 'Primary';

            return `
                <div class="card" style="display: flex; flex-direction: column; gap: 1.25rem; transition: transform 0.2s ease;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 48px; height: 48px; border-radius: 14px; background: rgba(0,0,0,0.03); display: grid; place-items: center; font-weight: 800; color: var(--brand-gunmetal);">
                            ${esc(w.name.charAt(0))}
                        </div>
                        <div style="flex: 1;">
                            <div style="font-weight: 700; color: var(--brand-gunmetal); display: flex; align-items: center; gap: 0.5rem;">
                                ${esc(w.name)}
                                <span class="campus-badge ${campusClass}">${esc(campusLabel)}</span>
                            </div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">${esc(w.class?.name || 'Academic Stream')}</div>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div style="background: rgba(0,0,0,0.02); padding: 0.75rem; border-radius: 10px;">
                            <div style="font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Term GPA</div>
                            <div style="font-size: 0.95rem; font-weight: 800; color: var(--brand-gunmetal);">${(w.avgGrade || 0).toFixed(1)}</div>
                        </div>
                        <div style="background: rgba(0,0,0,0.02); padding: 0.75rem; border-radius: 10px;">
                            <div style="font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Attendance</div>
                            <div style="font-size: 0.95rem; font-weight: 800; color: var(--brand-gunmetal);">${w.attendanceRate || 0}%</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.75rem; margin-top: 0.5rem;">
                        <button class="glass" data-action="viewAcademic" data-child-id="${esc(w.id)}" style="flex: 1; padding: 0.65rem; font-size: 0.7rem; font-weight: 700;">Academic Records</button>
                        <button class="glass" data-action="viewFinancial" data-child-id="${esc(w.id)}" style="flex: 1; padding: 0.65rem; font-size: 0.7rem; font-weight: 700; color: var(--brand-moonstone);">Fees/Receipts</button>
                    </div>
                </div>
            `;
        }).join('');
        window.Wajina.setSafeHTML(grid, html);

        // Update Request Modal select
        const wardSel = document.getElementById('reqWard');
        if (wardSel) {
            window.Wajina.setSafeHTML(wardSel, '<option value="">Concerning ward...</option>' + 
                myWards.map(w => `<option value="${esc(w.id)}">${esc(w.name)} (${esc(w.campus || 'Primary')})</option>`).join(''));
        }
    }

    function renderCampusModule() {
        const moduleTitle = document.getElementById('moduleTitle');
        const moduleContent = document.getElementById('moduleContent');
        if (!moduleTitle || !moduleContent) return;

        // Detection: Use the campus of the first ward
        const primaryWard = myWards.find(w => w.campus === 'PRIMARY') || myWards[0];
        const isSecondary = primaryWard?.campus === 'SECONDARY';

        if (isSecondary) {
            moduleTitle.textContent = 'Secondary Exam & Assessment Roadmap';
            window.Wajina.setSafeHTML(moduleContent, `
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <div style="display: flex; gap: 1rem; align-items: center; padding: 1rem; background: rgba(0,0,0,0.02); border-radius: 12px;">
                        <div style="background: var(--brand-moonstone); color: white; padding: 0.5rem; border-radius: 8px; font-size: 0.7rem; font-weight: 800; text-align: center; width: 60px;">OCT 28</div>
                        <div style="flex: 1;">
                            <div style="font-size: 0.85rem; font-weight: 700;">Mid-Term Assessment Cycle</div>
                            <div style="font-size: 0.7rem; color: var(--text-muted);">Common to all Secondary classes.</div>
                        </div>
                        <i class="fa-solid fa-chevron-right" style="font-size: 0.8rem; opacity: 0.3;"></i>
                    </div>
                    <div style="display: flex; gap: 1rem; align-items: center; padding: 1rem; background: rgba(0,0,0,0.02); border-radius: 12px;">
                        <div style="background: var(--brand-gunmetal); color: white; padding: 0.5rem; border-radius: 8px; font-size: 0.7rem; font-weight: 800; text-align: center; width: 60px;">NOV 15</div>
                        <div style="flex: 1;">
                            <div style="font-size: 0.85rem; font-weight: 700;">WAEC/NECO Registration Deadline</div>
                            <div style="font-size: 0.7rem; color: var(--text-muted);">SS3 Students Engagement.</div>
                        </div>
                    </div>
                </div>
            `);
        } else {
            moduleTitle.textContent = 'Primary Timetable & Learning Path';
            window.Wajina.setSafeHTML(moduleContent, `
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                    <div style="background: rgba(81,156,171,0.05); padding: 1rem; border-radius: 12px; border: 1px solid rgba(81,156,171,0.1);">
                        <div style="font-size: 0.65rem; color: var(--brand-moonstone); font-weight: 800;">CURRENT</div>
                        <div style="font-size: 0.9rem; font-weight: 700; color: var(--brand-gunmetal); margin-top: 0.25rem;">Numeracy & Logic</div>
                        <div style="font-size: 0.7rem; color: var(--text-muted);">Room 104 -+ Mr. Adebayo</div>
                    </div>
                    <div style="background: rgba(255,198,79,0.05); padding: 1rem; border-radius: 12px; border: 1px solid rgba(255,198,79,0.1);">
                        <div style="font-size: 0.65rem; color: var(--brand-saffron); font-weight: 800;">UPCOMING (11:00)</div>
                        <div style="font-size: 0.9rem; font-weight: 700; color: var(--brand-gunmetal); margin-top: 0.25rem;">Literacy & Diction</div>
                        <div style="font-size: 0.7rem; color: var(--text-muted);">Main Library -+ Mrs. Okafor</div>
                    </div>
                </div>
            `);
        }
    }

    function renderComplaints() {
        const el = document.getElementById('myRequestsList');
        if (!el) return;

        if (!myComplaints.length) {
            window.Wajina.setSafeHTML(el, '<p style="font-size: 0.7rem; color: var(--text-muted); text-align: center;">No active support tickets found.</p>');
            return;
        }

        const html = myComplaints.slice(0, 3).map(c => `
            <div style="padding: 0.85rem; border-radius: 12px; background: rgba(0,0,0,0.02); border-left: 4px solid ${c.status === 'RESOLVED' ? '#22c55e' : 'var(--brand-moonstone)'};">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="font-size: 0.85rem; font-weight: 700; color: var(--brand-gunmetal);">${esc(c.subject)}</div>
                    <span style="font-size: 0.6rem; font-weight: 800; color: var(--text-muted);">${c.status}</span>
                </div>
                <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.25rem;">To: ${esc(c.targetRole)} -+ ${new Date(c.createdAt).toLocaleDateString()}</div>
                ${c.response ? `<div style="font-size: 0.7rem; background: white; margin-top: 0.5rem; padding: 0.5rem; border-radius: 6px; border: 1px solid rgba(0,0,0,0.05);"><strong>Staff:</strong> ${esc(c.response)}</div>` : ''}
            </div>
        `).join('');
        window.Wajina.setSafeHTML(el, html);
    }

    function renderAnnouncements() {
        const list = document.getElementById('announcementList');
        if (!list) return;

        // Mock static announcements for initial version
        window.Wajina.setSafeHTML(list, `
            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                <div style="font-size: 0.8rem; font-weight: 700;">Inter-House Sports Day</div>
                <div style="font-size: 0.7rem; opacity: 0.65;">Friday, Nov 1st. Prep house colors for all campuses.</div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.25rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.1);">
                <div style="font-size: 0.8rem; font-weight: 700;">Parent-Teacher Conference</div>
                <div style="font-size: 0.7rem; opacity: 0.65;">Book your slots via the academic portal.</div>
            </div>
        `);
    }

    /**
     * Actions & Handlers
     */
    async function handleSubmitTicket(e) {
        e.preventDefault();
        const btn = document.getElementById('submitTicketBtn');
        const subject = document.getElementById('reqSubject')?.value;
        const message = document.getElementById('reqDetail')?.value;
        const targetRole = document.getElementById('reqRecipient')?.value;
        const studentId = document.getElementById('reqWard')?.value;

        if (!subject || !message || !targetRole || !studentId) {
            window.Wajina.Toast.show('Please complete all fields.');
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Transmitting...';
        }

        try {
            await apiFetch('/api/complaints', {
                method: 'POST',
                body: JSON.stringify({ subject, message, targetRole, studentId })
            });

            window.Wajina.Toast.show('Ticket Submitted Successfully.');
            closeModal('requestModal');
            
            // Refresh local data
            const complaintsRes = await apiFetch('/api/complaints');
            myComplaints = complaintsRes || [];
            renderComplaints();

        } catch (err) {
            window.Wajina.Toast.show('Broadcast Failure: ' + err.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Submit Ticket';
            }
        }
    }

    function closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'none';
        document.getElementById('requestForm')?.reset();
    }

    /**
     * Event Listeners
     */
    window.addEventListener('authReady', initDashboard);

    const requestForm = document.getElementById('requestForm');
    if (requestForm) {
        requestForm.addEventListener('submit', handleSubmitTicket);
    }

    document.addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        const action = btn.getAttribute('data-action');
        if (action === 'openRequestModal') {
            const modal = document.getElementById('requestModal');
            if (modal) modal.style.display = 'flex';
        } else if (action === 'closeModal') {
            closeModal(btn.getAttribute('data-modal-id'));
        } else if (action === 'viewAcademic') {
            const id = btn.getAttribute('data-child-id');
            window.location.href = `/student-results-detail.html?id=${id}`;
        } else if (action === 'viewFinancial') {
            const id = btn.getAttribute('data-child-id');
            window.Wajina.Toast.show('Opening Financial records for ward...');
        }
    });

})();
