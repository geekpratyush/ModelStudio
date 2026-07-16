const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set a clean high-resolution viewport
  await page.setViewportSize({ width: 1440, height: 900 });
  
  console.log('Navigating to Model Studio dev server...');
  await page.goto('http://localhost:5174/ModelStudio/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Take screenshot of landing page first (Pass 1 - we will update this later in Pass 3)
  console.log('Taking landing page screenshot...');
  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  await page.screenshot({ path: path.join(publicDir, 'screenshot_landing.png') });
  
  // Click Launch Studio
  console.log('Launching studio...');
  await page.click('button:has-text("Launch Studio")');
  await page.waitForTimeout(2000);
  
  // Workspace 1: Code as Diagram (CAD) with Notepad++ tabs
  console.log('Setting up Code as Diagram workspace...');
  // Create tab 2: Sequence Diagram
  await page.click('button[title="New diagram tab"]');
  await page.waitForTimeout(500);
  await page.click('button:has-text("Sequence")');
  await page.waitForTimeout(1000);
  
  // Create tab 3: State Diagram
  await page.click('button[title="New diagram tab"]');
  await page.waitForTimeout(500);
  await page.click('button:has-text("State")');
  await page.waitForTimeout(1000);
  
  // Go back to the first tab (Code as Diagram)
  await page.click('text=Code as Diagram');
  await page.waitForTimeout(1500); // Wait for monaco and mermaid to render
  
  console.log('Taking CAD screenshot...');
  await page.screenshot({ path: path.join(publicDir, 'screenshot_cad.png') });
  
  // Workspace 2: Diagrams
  console.log('Setting up Diagrams workspace...');
  await page.click('button:has-text("Diagrams")');
  await page.waitForTimeout(1000);
  await page.click('button:has-text("Templates")');
  await page.waitForTimeout(500);
  await page.click('text=3. Microservice Topology');
  await page.waitForTimeout(1500);
  console.log('Taking Diagrams screenshot...');
  await page.screenshot({ path: path.join(publicDir, 'screenshot_architecture.png') });
  
  // Workspace 3: DDD
  console.log('Setting up Domain Driven Design workspace...');
  await page.click('button:has-text("Domain Driven Design")');
  await page.waitForTimeout(1000);
  await page.click('button:has-text("Templates")');
  await page.waitForTimeout(500);
  await page.click('text=2. Strategic Shipping & Logistics');
  await page.waitForTimeout(1500);
  console.log('Taking DDD screenshot...');
  await page.screenshot({ path: path.join(publicDir, 'screenshot_ddd.png') });
  
  // Workspace 4: Camel (EIP)
  console.log('Setting up Camel workspace...');
  await page.click('button:has-text("Camel")');
  await page.waitForTimeout(1000);
  await page.click('button:has-text("Templates")');
  await page.waitForTimeout(500);
  await page.click('text=4. Transactional Saga Pipeline');
  await page.waitForTimeout(1500);
  console.log('Taking Camel screenshot...');
  await page.screenshot({ path: path.join(publicDir, 'screenshot_camel.png') });
  
  // Workspace 5: Draw
  console.log('Setting up Draw workspace...');
  await page.click('button:has-text("Draw")');
  await page.waitForTimeout(1000);
  
  // Add a sticky note to make the canvas interesting
  await page.click('button[title*="Sticky Note"]');
  await page.waitForTimeout(800);
  
  console.log('Taking Draw screenshot...');
  await page.screenshot({ path: path.join(publicDir, 'screenshot_draw.png') });
  
  // Workspace 6: Help Modal
  console.log('Opening Help Modal...');
  await page.click('button[title*="Help & Reference"]');
  await page.waitForTimeout(800);
  console.log('Taking Help screenshot...');
  await page.screenshot({ path: path.join(publicDir, 'screenshot_help.png') });
  
  await browser.close();
  console.log('Screenshots generated successfully!');
})().catch(err => {
  console.error('Failed to capture screenshots:', err);
  process.exit(1);
});
