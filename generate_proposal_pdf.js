// generate_proposal_pdf.js
// Node.js script to generate a two-page PDF proposal using Puppeteer and Tailwind CSS

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCHOOL_NAME = 'Your School Name'; // Replace as needed
const BRAND_NAME = 'Your Name/Brand'; // Replace as needed
const OUTPUT_PDF = 'Unified_School_Vision_2026.pdf';

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Unified School Vision 2026</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <style>
    body { background: #FDFDFD; color: #2D3748; }
    .primary { color: #001f3f; }
    .bg-primary { background: #001f3f; }
    .icon { font-size: 2.5rem; }
    .page-break { page-break-after: always; }
  </style>
</head>
<body class="font-sans">
  <!-- Page 1 -->
  <div class="w-full min-h-screen flex flex-col justify-between p-12">
    <header class="flex items-center justify-between mb-8">
      <div class="text-2xl font-bold primary">${BRAND_NAME}</div>
      <div class="text-lg font-semibold">Digital Systems Architect</div>
    </header>
    <main>
      <h1 class="text-4xl font-extrabold mb-2 primary">The 'Digital Brain' for ${SCHOOL_NAME}</h1>
      <h2 class="text-2xl font-bold mb-8">A Unified Command Centre for 1,300 Students & 2 Campuses</h2>
      <div class="space-y-8">
        <section class="flex items-start space-x-4">
          <span class="icon">🪞</span>
          <div>
            <h3 class="text-xl font-bold mb-1">The Mirror in your Pocket (Owner View)</h3>
            <p>The Director can see the school's <span class="font-semibold">heartbeat</span>—money and grades—right from their phone, anywhere in the world. It's like having a magic mirror that shows how the school is doing, anytime.</p>
          </div>
        </section>
        <section class="flex items-start space-x-4">
          <span class="icon">💰</span>
          <div>
            <h3 class="text-xl font-bold mb-1">The Truth Ledger (Bursar View)</h3>
            <p>Imagine a <span class="font-semibold">Digital Vault</span> that automatically recognizes when a parent pays. The Bursar never has to guess—every payment is safely recorded and visible, like a bank statement that updates itself.</p>
          </div>
        </section>
        <section class="flex items-start space-x-4">
          <span class="icon">🧮</span>
          <div>
            <h3 class="text-xl font-bold mb-1">The Genius Calculator (Academic Engine)</h3>
            <p>Teachers stop using calculators! They just type in the scores, and the system magically finds the <span class="font-semibold">Positions</span> (1st, 2nd, 3rd) and averages. No more manual calculations—just results, instantly.</p>
          </div>
        </section>
        <section class="flex items-start space-x-4">
          <span class="icon">💾</span>
          <div>
            <h3 class="text-xl font-bold mb-1">Benue-Proof Tech</h3>
            <p>Our 'Offline-Sync' is like a <span class="font-semibold">Memory Bank</span>—it keeps working even when the internet sleeps, saving everything for later. No lost data, ever.</p>
          </div>
        </section>
      </div>
    </main>
  </div>
  <div class="page-break"></div>
  <!-- Page 2 -->
  <div class="w-full min-h-screen flex flex-col justify-between p-12">
    <main>
      <h2 class="text-3xl font-extrabold mb-6 primary">The Implementation Roadmap</h2>
      <table class="w-full mb-8 border border-gray-200 rounded-lg overflow-hidden">
        <thead class="bg-primary text-white">
          <tr>
            <th class="py-3 px-4 text-left">Step</th>
            <th class="py-3 px-4 text-left">Description</th>
            <th class="py-3 px-4 text-left">Amount</th>
          </tr>
        </thead>
        <tbody class="bg-white text-gray-800">
          <tr class="border-b">
            <td class="py-3 px-4 font-bold">1</td>
            <td class="py-3 px-4">Building the Foundation & Moving the 1,300 paper records into the Digital Vault</td>
            <td class="py-3 px-4 font-semibold">₦1,000,000</td>
          </tr>
          <tr class="border-b">
            <td class="py-3 px-4 font-bold">2</td>
            <td class="py-3 px-4">Opening the Money & Result Gates (Live Testing)</td>
            <td class="py-3 px-4 font-semibold">₦1,100,000</td>
          </tr>
          <tr>
            <td class="py-3 px-4 font-bold">3</td>
            <td class="py-3 px-4">The WhatsApp Connection & Teaching the Staff</td>
            <td class="py-3 px-4 font-semibold">₦900,000</td>
          </tr>
        </tbody>
      </table>
      <section class="mb-6">
        <h3 class="text-xl font-bold mb-1">The "Self-Funding" Clause</h3>
        <p>The ₦200/student fee is a <span class="font-semibold">Digital Maintenance Levy</span>—a small contribution that keeps the lights on forever, without touching the school's main budget.</p>
      </section>
      <section>
        <h3 class="text-xl font-bold mb-1">Terms</h3>
        <p><span class="font-semibold">Year 1 is 100% Free</span> (Hosting, .com address, and Support included).</p>
      </section>
    </main>
  </div>
</body>
</html>
`;

async function generatePDF() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: OUTPUT_PDF,
    format: 'A4',
    printBackground: true,
    margin: { top: '32px', bottom: '32px', left: '32px', right: '32px' },
  });
  await browser.close();
  console.log(`PDF generated: ${OUTPUT_PDF}`);
}

generatePDF().catch(console.error);
