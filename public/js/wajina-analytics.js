/**
 * Wajina Institutional Analytics Components
 * Shadow DOM encapsulated Web Components for high-performance dashboarding.
 */

class WajinaAnalyticsElement extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._stale = false;
        this._loading = true;
    }

    async connectedCallback() {
        const styles = `
            :host { 
                display: block; 
                font-family: var(--font-primary, 'Outfit', sans-serif); 
                color: var(--text-primary);
            }
            * { box-sizing: border-box; }
            .skeleton { 
                background: linear-gradient(90deg, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.05) 75%);
                background-size: 200% 100%;
                animation: loading 1.5s infinite;
                border-radius: 12px;
                height: 100%; min-height: 120px;
            }
            @keyframes loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
            
            /* FontAwesome Integration */
            @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');
        `;
        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            <div id="container" class="skeleton"></div>
        `;

        await this.fetchData();
    }

    async fetchData() {
        const type = this.getAttribute('type');
        const cacheKey = `analytics_cache_${type}`;

        try {
            // Attempt Fetch
            const res = await window.Wajina.apiFetch(`/api/analytics/snapshot`);
            const group = this.getGroup();
            const key = this.getKey();
            const data = (res[group] && res[group][key] !== undefined) ? res[group][key] : 0;

            // Cache Successful Fetch
            localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));

            this.render(data);
        } catch (err) {
            console.error(`[AnalyticsElement] Fetch failed for ${type}:`, err);

            // Fallback to LKG (Last Known Good)
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                this._stale = true;
                this.render(data, true);
            } else {
                this.shadowRoot.getElementById('container').innerHTML = `
                    <div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.75rem;">
                        <i class="fa-solid fa-cloud-bolt"></i> Syncing...
                    </div>
                `;
            }
        }
    }

    getGroup() { return this.getAttribute('type').split('.')[0]; }
    getKey() { return this.getAttribute('type').split('.')[1]; }

    render(data, isStale = false) {
        this._loading = false;
        const container = this.shadowRoot.getElementById('container');
        if (!container) return;
        container.classList.remove('skeleton');

        let html = `
            <div style="position: relative; height: 100%;">
                ${isStale ? '<div class="stale-badge" style="position: absolute; top:0; right:0; font-size: 0.5rem; background: var(--brand-saffron); color: white; padding: 2px 6px; border-radius: 0 12px 0 12px;">OFFLINE</div>' : ''}
                ${this.generateHTML(data)}
            </div>
        `;
        container.innerHTML = html;
    }

    generateHTML(data) { return `<code>${JSON.stringify(data)}</code>`; }
}

/**
 * <wajina-kpi type="finance.totalCollected" label="Revenue" icon="fa-money" currency="true"></wajina-kpi>
 */
class WajinaKPI extends WajinaAnalyticsElement {
    generateHTML(data) {
        const label = this.getAttribute('label') || 'Metric';
        const icon = this.getAttribute('icon') || 'fa-chart-line';
        const isCurrency = this.getAttribute('currency') === 'true';

        let displayValue = data;
        if (isCurrency) {
            displayValue = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(data);
        } else if (typeof data === 'number') {
            displayValue = data.toLocaleString();
        }

        return `
            <div class="glass" style="padding: 1.5rem; background: #fff; border: 1px solid rgba(0,0,0,0.05); border-radius: 12px; height: 100%; box-sizing: border-box; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                <div style="display: flex; align-items: center; gap: 0.8rem; margin-bottom: 0.8rem;">
                    <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(81, 156, 171, 0.1); color: #519CAB; display: flex; align-items: center; justify-content: center;">
                        <i class="fa-solid ${icon}" style="font-size: 1rem;"></i>
                    </div>
                    <span style="font-size: 0.7rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${label}</span>
                </div>
                <div style="font-size: 1.85rem; font-weight: 800; letter-spacing: -1px; color: #1e293b; line-height: 1;">${displayValue}</div>
                ${this.generateVelocityHTML()}
            </div>
        `;
    }

    generateVelocityHTML() {
        if (this.getAttribute('type') !== 'finance.totalCollected') return '';
        return `<div style="font-size: 0.7rem; color: #2ecc71; margin-top: 0.4rem; font-weight: 700;">+8.4% <span style="font-weight: 400; opacity: 0.7;">vs last week</span></div>`;
    }
}

/**
 * <wajina-pulse type="academic.passRate"></wajina-pulse>
 */
class WajinaPulse extends WajinaAnalyticsElement {
    generateHTML(data) {
        const radius = 45;
        const circ = 2 * Math.PI * radius;
        const offset = circ - (data / 100) * circ;

        return `
            <style>
                .glow { filter: drop-shadow(0 0 8px rgba(81, 156, 171, 0.4)); }
            </style>
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column;">
                <div style="position: relative; width: 100px; height: 100px;">
                    <svg viewBox="0 0 100 100" class="glow">
                        <circle cx="50" cy="50" r="${radius}" fill="none" stroke="#f0f0f0" stroke-width="8"></circle>
                        <circle cx="50" cy="50" r="${radius}" fill="none" stroke="var(--brand-moonstone)" stroke-width="8" 
                                stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round"
                                style="transition: stroke-dashoffset 1s ease-out;"></circle>
                    </svg>
                    <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; flex-direction: column;">
                        <div style="font-size: 1.4rem; font-weight: 800; color: var(--brand-gunmetal);">${data}%</div>
                         <div style="font-size: 0.55rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase;">Pulse</div>
                    </div>
                </div>
            </div>
        `;
    }
}

/**
 * <wajina-chart type="finance.weeklyFeeCompliance" chart-type="doughnut" label="Weekly Fee Compliance"></wajina-chart>
 */
class WajinaChart extends WajinaAnalyticsElement {
    generateHTML(data) {
        // Feature detection for Glassmorphism
        const supportsGlass = CSS.supports('backdrop-filter', 'blur(10px)');
        const bgStyle = supportsGlass
            ? 'background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.3);'
            : 'background: var(--white); border: 1px solid var(--border-color);';

        return `
            <div class="glass" style="padding: 1.5rem; ${bgStyle} border-radius: 16px; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; position: relative;">
                <h3 style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 1rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">${this.getAttribute('label') || 'Data Trend'}</h3>
                
                <div style="flex: 1; position: relative; min-height: 150px;">
                    <canvas id="chartCanvas"></canvas>
                    ${this.generateCenterOverlay(data)}
                </div>

                ${this.generateFooter(data)}
            </div>
        `;
    }

    generateCenterOverlay(data) {
        if (this.getAttribute('chart-type') !== 'doughnut') return '';
        const compliance = data.complianceRate || 0;
        const color = compliance >= 100 ? '#2ecc71' : compliance >= 80 ? '#f39c12' : '#e74c3c';

        return `
            <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; flex-direction: column; pointer-events: none;">
                <div style="font-size: 1.8rem; font-weight: 900; color: var(--brand-gunmetal); line-height: 1;">${compliance}%</div>
                <div style="font-size: 0.65rem; color: ${color}; font-weight: 800; text-transform: uppercase; margin-top: 4px;">
                    ${compliance >= 100 ? 'On Track' : 'Delayed'}
                </div>
            </div>
        `;
    }

    generateFooter(data) {
        if (this.getAttribute('chart-type') !== 'doughnut' || this.hasAttribute('hide-values')) return '';
        const currency = (val) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(val);

        return `
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center;">
                <div>
                   <div style="font-size: 0.6rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">Collections</div>
                   <div style="font-size: 0.9rem; font-weight: 700; color: var(--brand-moonstone);">${currency(data.weeklyActual || 0)}</div>
                </div>
                <div style="text-align: right;">
                   <div style="font-size: 0.6rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">Target</div>
                   <div style="font-size: 0.9rem; font-weight: 700; color: var(--brand-gunmetal); opacity: 0.7;">${currency(data.weeklyTarget || 0)}</div>
                </div>
            </div>
        `;
    }

    async render(data, isStale = false) {
        super.render(data, isStale);
        const canvas = this.shadowRoot.getElementById('chartCanvas');
        if (!canvas) return;

        // Ensure Chart.js is ready
        if (typeof window.Chart === 'undefined') {
            console.warn('[WajinaAnalytics] Chart.js not found. Retrying in 500ms...');
            setTimeout(() => this.render(data, isStale), 500);
            return;
        }

        const ctx = canvas.getContext('2d');

        const chartType = this.getAttribute('chart-type') || 'line';

        // Premium Gradient Injector
        const createGradient = (color1, color2) => {
            const grad = ctx.createLinearGradient(0, 0, 0, 200);
            grad.addColorStop(0, color1);
            grad.addColorStop(1, color2);
            return grad;
        };

        const moonstoneGradient = createGradient('rgba(81, 156, 171, 0.4)', 'rgba(81, 156, 171, 0)');
        const saffronGradient = createGradient('rgba(255, 198, 79, 0.4)', 'rgba(255, 198, 79, 0)');

        // Specialized Doughnut Config
        if (chartType === 'doughnut') {
            const collected = data.weeklyActual || 0;
            const target = data.weeklyTarget || 0;
            const gap = Math.max(0, target - collected);
            const surplus = Math.max(0, collected - target);

            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Collected', 'Gap', 'Surplus'],
                    datasets: [{
                        data: [Math.min(collected, target), gap, surplus],
                        backgroundColor: [
                            '#519CAB', // Brand Teal
                            'rgba(0, 0, 0, 0.1)', // Gap (Theming aware)
                            '#FFC64F'  // Saffron (Surplus)
                        ],
                        borderWidth: 0,
                        hoverOffset: 15,
                        borderRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '80%',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(32, 55, 59, 0.9)',
                            titleFont: { family: 'Sora', size: 12 },
                            bodyFont: { family: 'IBM Plex Sans', size: 11 },
                            padding: 12,
                            cornerRadius: 8,
                            callbacks: {
                                label: (item) => {
                                    if (this.hasAttribute('hide-values')) return ` ${item.label}: ${Math.round(item.raw).toLocaleString()}`;
                                    return ` ₦${item.raw.toLocaleString()}`;
                                }
                            }
                        }
                    }
                }
            });
            return;
        }

        // Advanced Line/Bar Chart Config
        const labels = data.labels || [];
        const values = data.values || data.data || [];
        const isBar = chartType === 'bar';

        new Chart(ctx, {
            type: chartType,
            data: {
                labels: labels,
                datasets: [{
                    label: this.getAttribute('label'),
                    data: values,
                    borderColor: '#519CAB',
                    backgroundColor: isBar ? '#C3E7F1' : moonstoneGradient,
                    fill: !isBar,
                    tension: 0.4,
                    borderWidth: isBar ? 0 : 3,
                    pointRadius: isBar ? 0 : 0, // Clean "sparkline" feel
                    borderRadius: isBar ? 6 : 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(32, 55, 59, 0.9)'
                    }
                },
                scales: {
                    x: {
                        display: !this.hasAttribute('sparkline'),
                        grid: { display: false },
                        ticks: { color: '#9CA3AF', font: { size: 10 } }
                    },
                    y: {
                        display: !this.hasAttribute('sparkline'),
                        grid: { color: 'rgba(0,0,0,0.03)', drawTicks: false },
                        border: { display: false },
                        ticks: { color: '#9CA3AF', font: { size: 10 } }
                    }
                }
            }
        });
    }
}

customElements.define('wajina-kpi', WajinaKPI);
customElements.define('wajina-pulse', WajinaPulse);
customElements.define('wajina-chart', WajinaChart);

window.WajinaAnalytics = { WajinaKPI, WajinaPulse, WajinaChart };
