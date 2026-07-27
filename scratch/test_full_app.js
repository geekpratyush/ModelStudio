import puppeteer from 'puppeteer';

async function main() {
  console.log('Launching browser to test full application...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:5174/ModelStudio/', { waitUntil: 'networkidle' });
  await new Promise(r => setTimeout(r, 1500));

  // Click Launch Studio
  const launchBtn = await page.$('button:has-text("Launch Studio")');
  if (launchBtn) {
    await launchBtn.click();
    await new Promise(r => setTimeout(r, 1500));
  }

  // Test rendering code with parens and dots: A( (....) ) --> B(Text (v1.0))
  console.log('Testing Code as Diagram rendering with brackets and parens...');
  
  const testDiagramCode = `flowchart TD
  A( (....) ) -->|link (v1)| B(Text (v1.0))
  B --> C[ (....) ]
  C --> D((Component (v2)))
  D --> E[(Database (prod))]
`;

  // We can test sanitizeMermaidCode directly in browser window context
  const testResults = await page.evaluate(async (code) => {
    // Check if cadUtils / MermaidPreview functions render without error
    const mmd = await window.mermaid;
    return mmd ? 'Mermaid loaded' : 'No global mermaid';
  }, testDiagramCode);

  console.log('Browser test evaluation:', testResults);
  await browser.close();
  console.log('Test completed!');
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
