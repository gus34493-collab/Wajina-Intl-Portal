const fs = require('fs');
const file = 'director-dashboard.html';
const html = fs.readFileSync(file, 'utf8');

// The replacement logic
// We know lines 1940 to 2095 handles the layout-grid start to before Finance Snapshot
const lines = html.split('\n');

// Operational table lines: 1951 to 1991 (0-indexed: 1950 to 1990)
const opTable = lines.slice(1950, 1991).join('\n');
const leaveTable = lines.slice(2000, 2066).join('\n');

const layoutReplacement = <div class="layout-grid" style="grid-template-columns: 1fr;">
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
<button class="panel minimized-panel" id="minOperationalPrioritiesBtn" style="cursor:pointer; text-align:left; transition: transform 0.2s ease, box-shadow 0.2s ease; display:block; padding:0; border:1px solid var(--border); background:#fff; width:100%; outline: none;" onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='var(--shadow-md)';this.style.borderColor='#2cc287'" onmouseout="this.style.transform='none';this.style.boxShadow='var(--shadow-sm)';this.style.borderColor='var(--border)'">
<div class="panel-head" style="border-bottom:none; border-radius:inherit;">
<div>
<h3 style="margin:0; font-size:1rem; color:var(--graphite-800);">Operational Priorities</h3>
<small style="color:var(--text-secondary); display:block; margin-top:.25rem;">Live list · Last sync 09:48</small>
</div>
<span style="color:var(--emerald-600); font-weight:bold; font-size: 1.2rem;">?</span>
</div>
</button>
<button class="panel minimized-panel" id="minLeaveApplicationsBtn" style="cursor:pointer; text-align:left; transition: transform 0.2s ease, box-shadow 0.2s ease; display:block; padding:0; border:1px solid var(--border); background:#fff; width:100%; outline: none;" onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='var(--shadow-md)';this.style.borderColor='#2cc287'" onmouseout="this.style.transform='none';this.style.boxShadow='var(--shadow-sm)';this.style.borderColor='var(--border)'">
<div class="panel-head" style="border-bottom:none; border-radius:inherit;">
<div>
<h3 style="margin:0; font-size:1rem; color:var(--graphite-800);">Leave Applications</h3>
<small style="color:var(--text-secondary); display:block; margin-top:.25rem;">Pending and approved requests</small>
</div>
<span style="color:var(--emerald-600); font-weight:bold; font-size: 1.2rem;">?</span>
</div>
</button>
<button class="panel minimized-panel" id="minRiskAlertsBtn" style="cursor:pointer; text-align:left; transition: transform 0.2s ease, box-shadow 0.2s ease; display:block; padding:0; border:1px solid var(--border); background:#fff; width:100%; outline: none;" onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='var(--shadow-md)';this.style.borderColor='#2cc287'" onmouseout="this.style.transform='none';this.style.boxShadow='var(--shadow-sm)';this.style.borderColor='var(--border)'">
<div class="panel-head" style="border-bottom:none; border-radius:inherit;">
<div>
<h3 style="margin:0; font-size:1rem; color:var(--graphite-800);">Risk & Compliance Alerts</h3>
<small style="color:var(--text-secondary); display:block; margin-top:.25rem;">Prioritized by severity</small>
</div>
<span style="color:var(--emerald-600); font-weight:bold; font-size: 1.2rem;">?</span>
</div>
</button>
<button class="panel minimized-panel" id="minParentRequestsBtn" style="cursor:pointer; text-align:left; transition: transform 0.2s ease, box-shadow 0.2s ease; display:block; padding:0; border:1px solid var(--border); background:#fff; width:100%; outline: none;" onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='var(--shadow-md)';this.style.borderColor='#2cc287'" onmouseout="this.style.transform='none';this.style.boxShadow='var(--shadow-sm)';this.style.borderColor='var(--border)'">
<div class="panel-head" style="border-bottom:none; border-radius:inherit;">
<div>
<h3 style="margin:0; font-size:1rem; color:var(--graphite-800);">Parents Complaints and Requests</h3>
<small id="parentReqBadge" style="color:var(--text-secondary); display:block; margin-top:.25rem;">0 open</small>
</div>
<span style="color:var(--emerald-600); font-weight:bold; font-size: 1.2rem;">?</span>
</div>
</button>
</div>
<div>;

let newHtmlArray = [];
for (let i = 0; i < lines.length; i++) {
    if (i >= 1939 && i <= 2094) {
        if (i === 1939) {
            newHtmlArray.push(layoutReplacement);
        }
        continue;
    }
    // Find the end script tag to inject JS
    if (lines[i].includes('</script>') && lines[i+2] && lines[i+2].includes('AUDIT LOG MODAL')) {
        newHtmlArray.push(
const minOperationalPrioritiesBtn = document.getElementById('minOperationalPrioritiesBtn');
const minLeaveApplicationsBtn = document.getElementById('minLeaveApplicationsBtn');
const minRiskAlertsBtn = document.getElementById('minRiskAlertsBtn');
const minParentRequestsBtn = document.getElementById('minParentRequestsBtn');

const opPrioritiesModal = document.getElementById('operationalPrioritiesViewModal');
const leaveAppsModal = document.getElementById('leaveApplicationsViewModal');
const riskAlertsModal = document.getElementById('riskComplianceViewModal');
const parentReqsModal = document.getElementById('parentRequestsViewModal');

const closeOpPriorities = () => { opPrioritiesModal.classList.remove('open'); opPrioritiesModal.setAttribute('aria-hidden', 'true'); };
const closeLeaveApps = () => { leaveAppsModal.classList.remove('open'); leaveAppsModal.setAttribute('aria-hidden', 'true'); };
const closeRiskAlerts = () => { riskAlertsModal.classList.remove('open'); riskAlertsModal.setAttribute('aria-hidden', 'true'); };
const closeParentReqs = () => { parentReqsModal.classList.remove('open'); parentReqsModal.setAttribute('aria-hidden', 'true'); };

minOperationalPrioritiesBtn.addEventListener('click', () => { opPrioritiesModal.classList.add('open'); opPrioritiesModal.setAttribute('aria-hidden', 'false'); });
minLeaveApplicationsBtn.addEventListener('click', () => { leaveAppsModal.classList.add('open'); leaveAppsModal.setAttribute('aria-hidden', 'false'); });
minRiskAlertsBtn.addEventListener('click', () => { riskAlertsModal.classList.add('open'); riskAlertsModal.setAttribute('aria-hidden', 'false'); });
minParentRequestsBtn.addEventListener('click', () => { parentReqsModal.classList.add('open'); parentReqsModal.setAttribute('aria-hidden', 'false'); });

document.getElementById('opPrioritiesCloseBtn').addEventListener('click', closeOpPriorities);
document.getElementById('leaveAppsCloseBtn').addEventListener('click', closeLeaveApps);
document.getElementById('riskAlertsCloseBtn').addEventListener('click', closeRiskAlerts);
document.getElementById('parentReqCloseBtn').addEventListener('click', closeParentReqs);

[
{ modal: opPrioritiesModal, close: closeOpPriorities },
{ modal: leaveAppsModal, close: closeLeaveApps },
{ modal: riskAlertsModal, close: closeRiskAlerts },
{ modal: parentReqsModal, close: closeParentReqs }
].forEach(item => {
item.modal.addEventListener('click', e => { if (e.target === item.modal) item.close(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && item.modal.classList.contains('open')) item.close(); });
});
);
        newHtmlArray.push(lines[i]);
        continue;
    }

    if (lines[i].includes('<!-- -- AUDIT LOG MODAL -- -->')) {
        newHtmlArray.push(<!-- -- OPERATIONAL PRIORITIES MODAL -- -->
<div class="staff-modal-overlay" id="operationalPrioritiesViewModal" aria-hidden="true" style="z-index:330;">
<div class="staff-modal" role="dialog" aria-modal="true" style="width:min(900px,100%);">
<div class="staff-modal-head">
<div>
<h4>Operational Priorities</h4>
<p style="font-size:.78rem;color:var(--text-secondary);margin:.12rem 0 0;">Live list · Last sync 09:48</p>
</div>
                <div>
    <button class="btn" id="createPriorityBtn" type="button" style="margin-right: 15px;">Create Priority</button>
    <button class="modal-close-btn" id="opPrioritiesCloseBtn" aria-label="Close">?</button>
                </div>
</div>
<div class="staff-modal-body" style="padding:0; max-height: 70vh; overflow-y: auto;">
 + opTable + 
</div>
</div>
</div>

<!-- -- LEAVE APPLICATIONS MODAL -- -->
<div class="staff-modal-overlay" id="leaveApplicationsViewModal" aria-hidden="true" style="z-index:330;">
<div class="staff-modal" role="dialog" aria-modal="true" style="width:min(900px,100%);">
<div class="staff-modal-head">
<div>
<h4>Leave Applications</h4>
<p style="font-size:.78rem;color:var(--text-secondary);margin:.12rem 0 0;">Pending and approved teacher requests</p>
</div>
<button class="modal-close-btn" id="leaveAppsCloseBtn" aria-label="Close">?</button>
</div>
<div class="staff-modal-body" style="padding:0; max-height: 70vh; overflow-y: auto;">
 + leaveTable + 
</div>
</div>
</div>

<!-- -- RISK & COMPLIANCE MODAL -- -->
<div class="staff-modal-overlay" id="riskComplianceViewModal" aria-hidden="true" style="z-index:330;">
<div class="staff-modal" role="dialog" aria-modal="true" style="width:min(700px,100%);">
<div class="staff-modal-head">
<div>
<h4>Risk & Compliance Alerts</h4>
<p style="font-size:.78rem;color:var(--text-secondary);margin:.12rem 0 0;">Prioritized by severity</p>
</div>
                <div>
    <button class="btn" id="openDirectorRiskModalBtn" type="button" style="margin-right: 15px;">Add Risk</button>
    <button class="modal-close-btn" id="riskAlertsCloseBtn" aria-label="Close">?</button>
                </div>
</div>
<div class="staff-modal-body" style="padding:1rem; max-height: 70vh; overflow-y: auto;">
                <div class="alert-list" id="directorRiskAlertList"></div>
</div>
</div>
</div>

<!-- -- PARENT REQUESTS MODAL -- -->
<div class="staff-modal-overlay" id="parentRequestsViewModal" aria-hidden="true" style="z-index:330;">
<div class="staff-modal" role="dialog" aria-modal="true" style="width:min(700px,100%);">
<div class="staff-modal-head">
<div>
<h4>Parents Complaints and Requests</h4>
</div>
<button class="modal-close-btn" id="parentReqCloseBtn" aria-label="Close">?</button>
</div>
<div class="staff-modal-body" style="padding:1rem; max-height: 70vh; overflow-y: auto;">
                <div id="parentReqList">
                    <p style="font-size:.84rem;color:var(--text-secondary);">No parent requests yet.</p>
                </div>
</div>
</div>
</div>
);
        newHtmlArray.push(lines[i]);
        continue;
    }

    newHtmlArray.push(lines[i]);
}

fs.writeFileSync(file, newHtmlArray.join('\n'), 'utf8');
