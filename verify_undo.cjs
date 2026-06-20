const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5174/ModelStudio/');
  await page.evaluate(() => localStorage.setItem('workspace', 'draw'));
  await page.reload();
  await page.waitForTimeout(1000);
  
  // Click "Open Studio" if landing page shown
  const btn = page.locator('button:has-text("Open Studio")');
  if (await btn.isVisible()) await btn.click();
  await page.waitForTimeout(500);

  // Select rectangle tool
  await page.keyboard.press('r');
  await page.waitForTimeout(200);

  // Draw first rectangle
  const canvas = page.locator('.react-flow__pane').first();
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + 100, box.y + 100);
  await page.mouse.down();
  await page.mouse.move(box.x + 200, box.y + 200);
  await page.mouse.up();
  await page.waitForTimeout(300);

  // Draw second rectangle
  await page.keyboard.press('r');
  await page.mouse.move(box.x + 250, box.y + 100);
  await page.mouse.down();
  await page.mouse.move(box.x + 350, box.y + 200);
  await page.mouse.up();
  await page.waitForTimeout(300);

  const countBefore = await page.locator('.react-flow__node').count();
  console.log('Nodes before undo:', countBefore);

  // Ctrl+Z undo
  await page.keyboard.press('Control+z');
  await page.waitForTimeout(300);
  const countAfterUndo = await page.locator('.react-flow__node').count();
  console.log('Nodes after undo:', countAfterUndo);

  // Ctrl+Shift+Z redo
  await page.keyboard.press('Control+Shift+z');
  await page.waitForTimeout(300);
  const countAfterRedo = await page.locator('.react-flow__node').count();
  console.log('Nodes after redo:', countAfterRedo);

  const pass = countBefore === 2 && countAfterUndo === 1 && countAfterRedo === 2;
  console.log(pass ? 'PASS' : 'FAIL');
  await browser.close();
})();
