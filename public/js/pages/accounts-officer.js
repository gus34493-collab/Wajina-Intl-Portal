(function () {
    'use strict';

    const apiFetch = window.Wajina.apiFetch;
    const esc = window.Wajina.DOMUtils.escapeHTML;

    let _apiPayments = [];
    let _apiExpenses = [];
    const DELEGATED_KEY = 'wajinaDirectorDelegatedCases';
    const FIN_SUMMARY_KEY = 'wajinaDirectorFinancialSummary';

    async function initDashboard(e) {
        const user = e.detail.user;
        const campus = user.campus || 'PRIMARY';
        
        try {
            const [paymentsRes, expensesRes] = await Promise.all([
                apiFetch(`/api/payments?campus=${campus}`),
                apiFetch(`/api/requests?category=EXPENSE`)
            ]);

            _apiPayments = paymentsRes?.payments || [];
            _apiExpenses = expensesRes?.expenses || [];

            renderAll();

        } catch (err) {
            console.error('Accounts Dashboard Error:', err);
            renderAll(); 
        }
    }

    function renderAll() {
        renderKpis(_apiPayments, _apiExpenses);
        renderLedger(_apiPayments);
        renderExpenses(_apiExpenses);
        renderPartTracker(_apiPayments);
    }

    function renderKpis(payments, expenses) {
        const total = payments.reduce((s, p) => s + Number(p.amount), 0);
        const portal = payments.filter(p => p.channel === 'portal').reduce((s, p) => s + Number(p.amount), 0);
        const partBal = payments.filter(p => p.paymentType === 'part').reduce((s, p) => s + (Number(p.totalFee || 0) - Number(p.amount)), 0);
        const pendingExp = expenses.filter(e => e.status === 'pending');
        const pendingExpAmt = pendingExp.reduce((s, e) => s + Number(e.amount), 0);

        const kpiTotal = document.getElementById('kpiTotalCollected');
        const kpiTotalSub = document.getElementById('kpiTotalSub');
        const kpiPortal = document.getElementById('kpiPortal');
        const kpiPortalSub = document.getElementById('kpiPortalSub');
        const kpiPart = document.getElementById('kpiPartBalance');
        const kpiPartSub = document.getElementById('kpiPartSub');
        const kpiExpense = document.getElementById('kpiExpense');
        const kpiExpenseSub = document.getElementById('kpiExpenseSub');

        if (kpiTotal) kpiTotal.textContent = `₦ ${total.toLocaleString()}`;
        if (kpiTotalSub) kpiTotalSub.textContent = `${payments.length} terminal entries`;
        
        if (kpiPortal) kpiPortal.textContent = `₦ ${portal.toLocaleString()}`;
        if (kpiPortalSub) kpiPortalSub.textContent = `${payments.filter(p=>p.channel==='portal').length} syncs`;
        
        if (kpiPart) kpiPart.textContent = `₦ ${partBal.toLocaleString()}`;
        if (kpiPartSub) kpiPartSub.textContent = `${payments.filter(p=>p.paymentType==='part').length} collections`;
        
        if (kpiExpense) kpiExpense.textContent = `₦ ${pendingExpAmt.toLocaleString()}`;
        if (kpiExpenseSub) kpiExpenseSub.textContent = `${pendingExp.length} active queries`;
    }

    function renderLedger(payments) {
        const tbody = document.getElementById('ledgerTableBody');
        if (!tbody) return;

        if (payments.length === 0) {
            window.Wajina.setSafeHTML(tbody, '<tr><td colspan="6" style="padding: 3rem; text-align: center; color: var(--text-muted);">No entries found for this cycle.</td></tr>');
            return;
        }

        const html = payments.slice(0, 15).map(p => `
            <tr style="border-bottom: 1px solid rgba(0,0,0,0.02);">
                <td style="padding: 1.25rem 0.5rem; font-size: 0.75rem;">${new Date(p.createdAt || p.date).toLocaleDateString()}</td>
                <td style="padding: 1.25rem 0.5rem; font-weight: 700; color: var(--brand-gunmetal);">${esc(p.student?.name || p.studentName)}</td>
                <td style="padding: 1.25rem 0.5rem; font-weight: 800; font-family: 'Sora', sans-serif;">₦ ${Number(p.amount).toLocaleString()}</td>
                <td style="padding: 1.25rem 0.5rem;"><span class="badge" style="background: rgba(81, 156, 171, 0.1); color: var(--brand-moonstone); font-size: 0.65rem;">${esc(p.channel.toUpperCase())}</span></td>
                <td style="padding: 1.25rem 0.5rem;"><span class="badge" style="background: ${p.status === 'SUCCESS' ? 'rgba(81, 156, 171, 0.1)' : 'rgba(0,0,0,0.05)'}; color: ${p.status === 'SUCCESS' ? 'var(--brand-moonstone)' : 'var(--text-muted)'}; font-size: 0.65rem;">${esc((p.status || 'LOGGED').toUpperCase())}</span></td>
                <td style="padding: 1.25rem 0.5rem; text-align: right;"><button class="glass" data-action="ledgerDetails" data-id="${esc(p.id)}" style="padding: 0.4rem 0.8rem; font-size: 0.7rem; font-weight: 700;">Details</button></td>
            </tr>
        `).join('');
        window.Wajina.setSafeHTML(tbody, html);
    }

    function renderExpenses(expenses) {
        const container = document.getElementById('expenseList');
        if (!container) return;

        const pending = expenses.filter(e => e.status === 'pending').slice(0, 3);
        if (pending.length === 0) {
            window.Wajina.setSafeHTML(container, '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No pending requests.</div>');
            return;
        }

        const html = pending.map(e => `
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(0,0,0,0.03); display: grid; place-items: center; flex-shrink: 0;">
                    <i class="fa-solid fa-file-invoice" style="font-size: 0.9rem; color: var(--text-secondary);"></i>
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 0.85rem; font-weight: 700; color: var(--brand-gunmetal); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${esc(e.title)}</div>
                    <div style="font-size: 0.7rem; color: var(--text-muted);">${esc(e.category)}</div>
                </div>
                <div style="font-size: 0.85rem; font-weight: 800; color: #ef4444;">₦ ${Number(e.amount).toLocaleString()}</div>
            </div>
        `).join('');
        window.Wajina.setSafeHTML(container, html);
    }

    function renderPartTracker(payments) {
        const container = document.getElementById('partPaymentList');
        if (!container) return;

        const parts = payments.filter(p => p.paymentType === 'part').slice(0, 3);
        if (parts.length === 0) {
            window.Wajina.setSafeHTML(container, '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No active part-payments.</div>');
            return;
        }

        const html = parts.map(p => {
            const balance = Number(p.totalFee || 0) - Number(p.amount);
            return `
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(255, 198, 79, 0.1); display: grid; place-items: center; flex-shrink: 0;">
                        <i class="fa-solid fa-hourglass-half" style="font-size: 0.9rem; color: var(--brand-saffron);"></i>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-size: 0.85rem; font-weight: 700; color: var(--brand-gunmetal); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${esc(p.student?.name || p.studentName)}</div>
                        <div style="font-size: 0.7rem; color: var(--text-muted);">Bal: ₦ ${balance.toLocaleString()}</div>
                    </div>
                    <button class="glass" data-action="updateBalance" data-id="${esc(p.id)}" style="padding: 0.4rem 0.8rem; font-size: 0.7rem; font-weight: 700; color: var(--brand-moonstone);">Update</button>
                </div>
            `;
        }).join('');
        window.Wajina.setSafeHTML(container, html);
    }

    function exportCsv() {
        if (!_apiPayments.length) { window.Wajina.Toast.show('No entries to export.'); return; }
        const headers = ['Date','Student Name','Amount (₦)','Channel','Status'];
        const rows = _apiPayments.map(p => {
            return [
                new Date(p.createdAt || p.date).toLocaleDateString(),
                (p.student?.name || p.studentName).replace(/,/g,''),
                p.amount,
                p.channel,
                p.status || 'LOGGED'
            ].join(',');
        });
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = 'wajina-income-ledger-' + new Date().toISOString().slice(0,10) + '.csv';
        a.click();
        URL.revokeObjectURL(url);
        window.Wajina.Toast.show('Income ledger exported as CSV.');
    }

    async function pushSummary() {
        const user = window.currentUser || {};
        const activeCampus = user.campus || 'PRIMARY';
        const total = _apiPayments.reduce((s, p) => s + Number(p.amount), 0);
        const approvedExpenses = _apiExpenses.filter(e => e.status === 'approved');
        const approvedTotal = approvedExpenses.reduce((s,e)=>s+Number(e.amount),0);
        const pendingExpTotal = _apiExpenses.filter(e=>e.status==='pending').reduce((s,e)=>s+Number(e.amount),0);

        const summary = {
            campus: activeCampus,
            totalCollected: total,
            portalTotal:    _apiPayments.filter(p=>p.channel==='portal').reduce((s,e)=>s+Number(e.amount),0),
            bankTotal:      _apiPayments.filter(p=>p.channel==='bank').reduce((s,e)=>s+Number(e.amount),0),
            cashTotal:      _apiPayments.filter(p=>p.channel==='cash').reduce((s,e)=>s+Number(e.amount),0),
            approvedExpenseTotal: approvedTotal,
            pendingExpenseTotal:  pendingExpTotal,
            ledgerCount:    _apiPayments.length,
            lastUpdated:    new Date().toLocaleString('en-NG'),
            lastUpdatedBy:  'Accounts Officer'
        };
        // localStorage persistence removed for security
        // TODO: Implement POST /api/finance/summary for persistent reporting
        window.Wajina.Toast.show('Analysis complete. Summary ready for Director review (API sync required).');
    }

    function openLogPaymentModal() {
        const dateEl = document.getElementById('lpDate');
        if (dateEl) dateEl.value = new Date().toISOString().slice(0,10);
        const modal = document.getElementById('logPaymentModal');
        if (modal) modal.style.display = 'flex';
    }

    function closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'none';
    }

    async function handleLogPayment() {
        const studentName = document.getElementById('lpStudentName')?.value.trim();
        const studentClass = document.getElementById('lpStudentClass')?.value.trim();
        const amount = parseFloat(document.getElementById('lpAmount')?.value) || 0;
        const channel = document.getElementById('lpChannel')?.value;
        const date = document.getElementById('lpDate')?.value;
        const reference = document.getElementById('lpReference')?.value.trim();
        const notes = document.getElementById('lpNotes')?.value.trim();

        if (!studentName || !amount) {
            window.Wajina.Toast.show('Student name and amount are required.');
            return;
        }

        try {
            const res = await apiFetch('/api/payments', {
                method: 'POST',
                body: JSON.stringify({
                    studentName,
                    studentClass,
                    amount,
                    channel,
                    date,
                    reference,
                    notes
                })
            });

            if (res) {
                window.Wajina.Toast.show('Payment successfully recorded.');
                closeModal('logPaymentModal');
                const user = JSON.parse(localStorage.getItem('wajina_user') || '{}');
                initDashboard({ detail: { user } });
            }
        } catch (err) {
            window.Wajina.Toast.show('Failed to save payment: ' + err.message);
        }
    }

    window.addEventListener('authReady', initDashboard);

    document.addEventListener('click', e => {
        const btn = e.target.closest('button, [data-action]');
        if (!btn) {
            if (e.target.id === 'logPaymentModal') closeModal('logPaymentModal');
            return;
        }

        const action = btn.getAttribute('data-action');
        if (action === 'toggleSidebar') {
            const layout = document.getElementById('dashboardLayout');
            if (layout) layout.classList.toggle('sidebar-open');
        } else if (action === 'ledgerDetails') {
            window.Wajina.Toast.show('Details view coming soon.');
        } else if (action === 'updateBalance') {
            window.Wajina.Toast.show('Balance update coming soon.');
        } else if (action === 'exportCsv') {
            exportCsv();
        } else if (action === 'pushSummary') {
            pushSummary();
        } else if (action === 'openLogPaymentModal') {
            openLogPaymentModal();
        } else if (action === 'closeModal') {
            const id = btn.getAttribute('data-modal-id');
            if (id) closeModal(id);
        }
    });

    const confirmLogPaymentBtn = document.getElementById('confirmLogPaymentBtn');
    if (confirmLogPaymentBtn) {
        confirmLogPaymentBtn.addEventListener('click', handleLogPayment);
    }
})();
