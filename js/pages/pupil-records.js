(function () {
    'use strict';

    const apiFetch = window.Wajina.apiFetch;
    const esc = window.Wajina.DOMUtils.escapeHTML;
    const DataService = window.Wajina.ArchiveDataService;

    const ArchiveManager = {
        state: {
            view: 'SESSIONS', // SESSIONS, CLASSES, ARMS, PUPILS, TRANSCRIPT
            session: null,
            class: null,
            arm: null,
            student: null,
            activeTerm: 'term3'
        },

        async init() {
            window.addEventListener('authReady', async (e) => {
                await this.loadSessions();
                this.bindEvents();
            });
        },

        bindEvents() {
            document.addEventListener('click', async e => {
                const btn = e.target.closest('[data-action]');
                if (!btn) return;
                const action = btn.getAttribute('data-action');

                if (action === 'navSessions') this.loadSessions();
                if (action === 'navClasses') this.loadClasses(this.state.session.id);
                if (action === 'navArms') this.loadArms(this.state.class.id);
                
                if (action === 'selectSession') this.loadClasses(btn.getAttribute('data-id'));
                if (action === 'selectClass') this.loadArms(btn.getAttribute('data-id'));
                if (action === 'selectArm') this.loadPupils(btn.getAttribute('data-id'));
                if (action === 'selectStudent') this.loadTranscript(btn.getAttribute('data-id'));
                
                if (action === 'setTerm') {
                    this.state.activeTerm = btn.getAttribute('data-term');
                    this.renderTranscript();
                }
                if (action === 'printTranscript') window.print();
                if (action === 'toggleSidebar') {
                    const layout = document.getElementById('dashboardLayout');
                    if (layout) layout.classList.toggle('sidebar-open');
                }
            });
        },

        async loadSessions() {
            this.state.view = 'SESSIONS';
            this.state.session = null;
            this.state.class = null;
            this.state.arm = null;
            this.state.student = null;
            
            const container = document.getElementById('mainArchiveArea');
            if (container) window.Wajina.setSafeHTML(container, '<div style="text-align:center; padding:10rem;"><i class="fa-solid fa-sync fa-spin fa-2x"></i></div>');
            
            try {
                const data = await DataService.getSessions();
                this.renderGrid(data, 'selectSession', 'fa-calendar-check', 'Academic Session');
                this.updateBreadcrumb();
            } catch (err) { alert('Archive sync failed.'); }
        },

        async loadClasses(sessionId) {
            this.state.view = 'CLASSES';
            this.state.class = null;
            this.state.arm = null;
            this.state.student = null;
            
            try {
                const sessions = await DataService.getSessions();
                this.state.session = sessions.find(s => s.id === sessionId);
                const classes = await DataService.getClasses();
                this.renderGrid(classes, 'selectClass', 'fa-graduation-cap', 'Academic Level');
                this.updateBreadcrumb();
            } catch (err) { alert('Level registry unavailable.'); }
        },

        async loadArms(classId) {
            this.state.view = 'ARMS';
            this.state.arm = null;
            this.state.student = null;
            
            try {
                const arms = await DataService.getArms(classId);
                // Fetching class details for breadcrumb
                const classes = await DataService.getClasses();
                this.state.class = classes.find(c => c.id === classId);
                this.renderGrid(arms, 'selectArm', 'fa-code-branch', 'Class Arm');
                this.updateBreadcrumb();
            } catch (err) { alert('Arm registry unavailable.'); }
        },

        async loadPupils(armId) {
            this.state.view = 'PUPILS';
            this.state.student = null;
            
            try {
                // Fetching arm details
                const arms = await DataService.getArms(this.state.class.id);
                this.state.arm = arms.find(a => a.id === armId);
                
                const pupils = await DataService.getStudentsInArm(armId, true, this.state.class.campus || 'PRIMARY');
                this.renderGrid(pupils, 'selectStudent', 'fa-user-graduate', 'Student Record');
                this.updateBreadcrumb();
            } catch (err) { alert('Pupil roster failure.'); }
        },

        async loadTranscript(pupilId) {
            this.state.view = 'TRANSCRIPT';
            const container = document.getElementById('mainArchiveArea');
            if (container) window.Wajina.setSafeHTML(container, '<div style="text-align:center; padding:10rem;"><i class="fa-solid fa-sync fa-spin fa-2x"></i></div>');
            
            try {
                const pupils = await DataService.getStudentsInArm(this.state.arm.id, true, this.state.class.campus || 'PRIMARY');
                this.state.student = pupils.find(p => p.id === pupilId);
                
                if (this.state.student) {
                    this.renderTranscript();
                    this.updateBreadcrumb();
                } else {
                    throw new Error('Student not found');
                }
            } catch (err) { alert('Digital Transcript failure.'); }
        },

        renderGrid(items, action, icon, typeLabel) {
            const container = document.getElementById('mainArchiveArea');
            if (!container) return;
            if (!items || items.length === 0) {
                window.Wajina.setSafeHTML(container, `
                    <div style="text-align:center; padding:10rem 2rem; background:white; border-radius:30px;">
                        <i class="fa-solid fa-folder-open fa-3x" style="opacity:0.05; margin-bottom:2rem;"></i>
                        <h3 style="font-weight:800; color:var(--brand-gunmetal);">No Registry Records</h3>
                        <p style="font-size:0.85rem; color:var(--text-muted);">The selected archive node is currently empty.</p>
                    </div>
                `);
                return;
            }

            const html = `<div class="archive-grid">` + items.map(item => `
                <div class="archive-card" data-action="${action}" data-id="${item.id}">
                    <i class="fa-solid ${icon}"></i>
                    <span style="font-size:0.65rem; font-weight:800; text-transform:uppercase; color:var(--text-muted); margin-bottom:0.4rem;">${typeLabel}</span>
                    <div style="font-weight:800; color:var(--brand-gunmetal); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; width:100%;">${esc(item.name)}</div>
                </div>
            `).join('') + `</div>`;
            window.Wajina.setSafeHTML(container, html);
        },

        renderTranscript() {
            const container = document.getElementById('mainArchiveArea');
            if (!container) return;
            const s = this.state.student;
            const tab = this.state.activeTerm;
            const level = s.classLevel || 'SECONDARY';
            const isSecondary = level === 'SECONDARY';

            const html = `
                <div id="printBtnCont" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3rem;">
                    <div class="term-selector">
                        <button class="term-btn ${tab === 'term1' ? 'active' : ''}" data-action="setTerm" data-term="term1">Term 1</button>
                        <button class="term-btn ${tab === 'term2' ? 'active' : ''}" data-action="setTerm" data-term="term2">Term 2</button>
                        <button class="term-btn ${tab === 'term3' ? 'active' : ''}" data-action="setTerm" data-term="term3">Term 3</button>
                    </div>
                    <button class="glass" data-action="printTranscript" style="background:var(--brand-gunmetal); color:white; border:none; padding:0.8rem 2rem; font-weight:800; display:flex; align-items:center; gap:0.75rem;">
                        <i class="fa-solid fa-print"></i> GENERATE PHYSICAL RECORD
                    </button>
                </div>

                <div class="transcript-container">
                    <div class="transcript-header">
                        <div>
                            <h1 style="font-weight: 800; font-size: 1.8rem; margin: 0; color: var(--brand-gunmetal);">ACADEMIC MASTERY RECORD</h1>
                            <div style="font-size: 0.8rem; font-weight: 700; color: var(--brand-moonstone); text-transform: uppercase; margin-top: 0.25rem;">Validated Institutional Archive</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 800; font-size: 1.25rem;">Wajina International Schools</div>
                            <div style="font-size: 0.65rem; font-weight: 700; color: var(--text-muted); opacity: 0.8;">Primary & Secondary Educational Excellence</div>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; margin-bottom: 3rem;">
                        <div style="display: flex; align-items: center; gap: 1.5rem;">
                            <div style="width: 80px; height: 80px; border-radius: 16px; background: #f8f9fa; border: 2px solid var(--brand-moonstone); display:grid; place-items:center;">
                                <i class="fa-solid fa-user-graduate fa-2x" style="opacity:0.2;"></i>
                            </div>
                            <div>
                                <div style="font-size: 0.6rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Student Identity</div>
                                <div style="font-weight: 800; font-size: 1.15rem; color: var(--brand-gunmetal);">${esc(s.name)}</div>
                                <div style="font-size: 0.75rem; color: var(--brand-moonstone); font-weight: 700;">ID: ${esc(s.id)}</div>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                            <div>
                                <div style="font-size: 0.6rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Class/Level</div>
                                <div style="font-weight: 800; font-size: 0.9rem;">${esc(s.className)}</div>
                                <div style="font-size: 0.75rem; font-weight: 700;">${esc(s.armName)}</div>
                            </div>
                            <div>
                                <div style="font-size: 0.6rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Cycle</div>
                                <div style="font-weight: 800; font-size: 0.9rem;">${esc(this.state.session.name)}</div>
                            </div>
                        </div>
                    </div>

                    <div style="overflow: hidden; border-radius: 12px; border: 1.5px solid rgba(0,0,0,0.03); margin-bottom: 3rem;">
                        <table class="report-table" style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr>
                                    <th style="text-align: left;">Academic Subject</th>
                                    <th>C.A (30)</th>
                                    <th>Exam (70)</th>
                                    <th style="text-align: right;">Total (100)</th>
                                    ${isSecondary ? `<th>Avg.</th><th>Pos.</th>` : ''}
                                    <th style="text-align: right;">Mastery</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${s.subjects.map((sub, idx) => {
                                    const score = sub[tab === 'term1' ? 't1' : (tab === 'term2' ? 't2' : 't3')];
                                    const ca = Math.round(score * 0.3);
                                    const exam = score - ca;
                                    const grade = window.Wajina.AcademicEngine.calculateGrade(score, level);
                                    return `
                                        <tr>
                                            <td style="font-weight: 800; color: var(--brand-gunmetal);">${esc(sub.n)}</td>
                                            <td style="text-align: center; font-weight: 700; color: var(--text-muted);">${ca}</td>
                                            <td style="text-align: center; font-weight: 700; color: var(--text-muted);">${exam}</td>
                                            <td style="text-align: right; font-weight: 900; color: var(--brand-gunmetal);">${score}</td>
                                            ${isSecondary ? `
                                                <td style="text-align: center; font-weight: 700; opacity: 0.5;">${sub.avg}</td>
                                                <td style="text-align: center; font-weight: 700; opacity: 0.5;">${idx + 1}</td>
                                            ` : ''}
                                            <td style="text-align: right; font-weight: 900; color: var(--brand-moonstone);">${grade.g}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(${isSecondary ? 3 : 2}, 1fr); gap: 1.5rem; margin-bottom: 3rem;">
                        <div style="background: #fcfcfc; padding: 1.5rem; border-radius: 16px; border: 1.5px solid rgba(0,0,0,0.02);">
                            <h4 style="font-size: 0.65rem; font-weight: 800; text-transform: uppercase; margin-bottom: 1rem; color: var(--text-muted);">Affective Strata</h4>
                            <div style="font-size: 0.75rem; display: flex; flex-direction: column; gap: 0.6rem;">
                                ${(isSecondary ? window.Wajina.AcademicEngine.AFFECTIVE_TRAITS.slice(0, 6) : ['Punctuality', 'Neatness', 'Politeness', 'Honesty']).map(t => `
                                    <div style="display: flex; justify-content: space-between; font-weight: 700;">
                                        <span style="opacity: 0.6;">${t}</span>
                                        <span style="color: var(--brand-moonstone);">5.0</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div style="background: #fcfcfc; padding: 1.5rem; border-radius: 16px; border: 1.5px solid rgba(0,0,0,0.02);">
                            <h4 style="font-size: 0.65rem; font-weight: 800; text-transform: uppercase; margin-bottom: 1rem; color: var(--text-muted);">Psychomotor Mastery</h4>
                            <div style="font-size: 0.75rem; display: flex; flex-direction: column; gap: 0.6rem;">
                                ${(isSecondary ? window.Wajina.AcademicEngine.PSYCHOMOTOR_SKILLS.slice(0, 4) : ['Handwriting', 'Reading', 'Sports']).map(t => `
                                    <div style="display: flex; justify-content: space-between; font-weight: 700;">
                                        <span style="opacity: 0.6;">${t}</span>
                                        <span style="color: var(--brand-moonstone);">4.0</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        ${isSecondary ? `
                            <div style="background: #fcfcfc; padding: 1.5rem; border-radius: 16px; border: 1.5px solid rgba(0,0,0,0.02);">
                                <h4 style="font-size: 0.65rem; font-weight: 800; text-transform: uppercase; margin-bottom: 1rem; color: var(--text-muted);">Mastery Scale</h4>
                                <div style="font-size: 0.65rem; opacity: 0.6; font-weight: 700; line-height: 1.6;">
                                    <div>5.0 - UNIFORM EXCELLENCE</div>
                                    <div>4.0 - HIGH MASTERY</div>
                                    <div>3.0 - COMPETENT RANGE</div>
                                    <div>2.0 - MINIMAL PROGRESS</div>
                                    <div>1.0 - REMEDIAL REQUIRED</div>
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5rem; margin-top: 3rem;">
                         <div style="font-size: 0.75rem; background: #fffcf8; padding: 1.5rem; border: 1.5px solid #fff5e6; border-radius: 12px; color: #b7791f;">
                            <strong style="display: block; font-size: 0.6rem; text-transform: uppercase; margin-bottom: 0.5rem; opacity: 0.7;">Academic Adviser</strong>
                            <div style="font-weight: 700; line-height: 1.4;">${s.status === 'PROMOTED' ? 'Exceptional mastery across core subjects.' : 'Requires focused remedial engagement.'}</div>
                         </div>
                         <div style="font-size: 0.75rem; background: #f8f9fa; padding: 1.5rem; border: 1.5px solid rgba(0,0,0,0.02); border-radius: 12px;">
                            <strong style="display: block; font-size: 0.6rem; text-transform: uppercase; margin-bottom: 0.5rem; opacity: 0.7;">Form Master</strong>
                            <div style="font-weight: 700; line-height: 1.4;">Commendable leadership signals and peer engagement.</div>
                         </div>
                         <div style="font-size: 0.75rem; background: #fff; padding: 1.5rem; border: 1.5px solid var(--brand-gunmetal); border-radius: 12px;">
                            <strong style="display: block; font-size: 0.6rem; text-transform: uppercase; margin-bottom: 0.5rem; opacity: 0.7;">Principal's Final Verdict</strong>
                            <div style="font-weight: 800; line-height: 1.4; color: var(--brand-gunmetal);">${s.avg > 80 ? 'An elite performance cycle. Outstanding.' : 'Promoted to subsequent academic year.'}</div>
                         </div>
                    </div>

                    <div style="margin-top: 5rem; display: flex; justify-content: space-between; align-items: flex-end;">
                        <div style="border-top: 2px solid var(--brand-gunmetal); width: 250px; text-align: center; padding-top: 1rem;">
                            <div style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--brand-gunmetal);">OFFICIAL REGISTRY STAMP</div>
                            <div style="font-size: 0.6rem; opacity: 0.4; font-weight: 700; letter-spacing: 0.1em; margin-top: 0.25rem;">MASTER VALIDATED RECORD</div>
                        </div>
                        <div style="text-align: right; opacity: 0.1; font-size: 2rem; font-weight: 900; letter-spacing: 12px;">
                            WAJINA
                        </div>
                    </div>
                </div>
            `;
            window.Wajina.setSafeHTML(container, html);
        },

        updateBreadcrumb() {
            const nav = document.getElementById('breadcrumb');
            if (!nav) return;
            let html = `<span class="breadcrumb-item" data-action="navSessions">Archives</span>`;
            if (this.state.session) html += `<span class="breadcrumb-separator"><i class="fa-solid fa-chevron-right"></i></span><span class="breadcrumb-item" data-action="navClasses">${esc(this.state.session.name)}</span>`;
            if (this.state.class) html += `<span class="breadcrumb-separator"><i class="fa-solid fa-chevron-right"></i></span><span class="breadcrumb-item" data-action="navArms">${esc(this.state.class.name)}</span>`;
            if (this.state.student) html += `<span class="breadcrumb-separator"><i class="fa-solid fa-chevron-right"></i></span><span style="opacity: 0.4;">${esc(this.state.student.name)}</span>`;
            window.Wajina.setSafeHTML(nav, html);
        }
    };

    window.Wajina = window.Wajina || {};
    window.Wajina.ArchiveManager = ArchiveManager;
    ArchiveManager.init();
})();
