const puppeteer = require('puppeteer');
const path = require('path');

describe('Wajina Institutional Analytics UI', () => {
    let browser;
    let page;

    beforeAll(async () => {
        browser = await puppeteer.launch({ headless: "new" });
        page = await browser.newPage();
    });

    afterAll(async () => {
        await browser.close();
    });

    test('Analytics KPI Elements Render with Shadow DOM', async () => {
        // Mocking the environment
        await page.evaluateOnNewDocument(() => {
            window.currentUser = { role: 'DIRECTOR', name: 'Test Director' };
            window.Wajina = { apiFetch: () => Promise.resolve({ finance: { totalCollected: 5000000 } }) };
        });

        // Load the component file directly (or a mock page)
        const filePath = `file://${path.resolve(__dirname, '../director-dashboard.html')}`;
        await page.goto(filePath);

        // Wait for custom elements to define
        await page.waitForFunction(() => customElements.get('wajina-kpi'));

        // Pierce Shadow DOM to check if KPI rendered
        const kpiText = await page.evaluate(() => {
            const kpi = document.querySelector('wajina-kpi');
            if (!kpi || !kpi.shadowRoot) return null;
            return kpi.shadowRoot.textContent;
        });

        expect(kpiText).toContain('Metric'); // Default label
    });

    test('Analytics Charts Render Canvas', async () => {
        const chartExists = await page.evaluate(() => {
            const chart = document.querySelector('wajina-chart');
            if (!chart || !chart.shadowRoot) return false;
            return !!chart.shadowRoot.querySelector('canvas');
        });

        expect(chartExists).toBe(true);
    });
});
