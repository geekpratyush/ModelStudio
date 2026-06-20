const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1600, height: 900 });
  
  await page.goto('http://localhost:5174/ModelStudio/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  
  // Click Draw tab
  await page.click('button:has-text("Draw")');
  await page.waitForTimeout(800);
  
  // Screenshot 1: full draw tab with toolbar
  await page.screenshot({ path: '/tmp/draw_toolbar.png', fullPage: false });
  console.log('Screenshot 1: toolbar saved');
  
  // Check toolbar elements
  const toolbarText = await page.evaluate(() => {
    const toolbar = document.querySelector('.ms-topbar-right .toolbar');
    return toolbar ? toolbar.innerText : 'not found';
  });
  console.log('Toolbar text (first 200):', toolbarText.substring(0, 200));

  // Check for undo/redo SVG buttons
  const undoBtn = await page.$('[title*="Undo"]');
  const redoBtn = await page.$('[title*="Redo"]');
  const eraserBtn = await page.$('[title*="Eraser"]');
  const lockBtn = await page.$('[title*="locked"]');
  console.log('Undo btn:', !!undoBtn, 'Redo btn:', !!redoBtn, 'Eraser:', !!eraserBtn, 'Lock:', !!lockBtn);

  // Check fill color & opacity inputs
  const colorInputs = await page.$$('input[type="color"]');
  const rangeInputs = await page.$$('input[type="range"]');
  console.log('Color inputs:', colorInputs.length, 'Range inputs:', rangeInputs.length);

  // Draw a rectangle: click rectangle tool, then drag on canvas
  await page.click('[title*="Rectangle"]');
  await page.waitForTimeout(300);
  
  // Drag on canvas to draw rectangle
  const canvas = await page.$('.react-flow__pane');
  if (canvas) {
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 380, box.y + 320, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(500);
    console.log('Rectangle drawn');
  }
  
  await page.screenshot({ path: '/tmp/draw_after_rect.png' });
  console.log('Screenshot 2: after rect saved');

  // Count nodes
  const nodes = await page.$$('.react-flow__node');
  console.log('Nodes after drawing rect:', nodes.length);

  // Undo with Ctrl+Z
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  await page.keyboard.press('Control+z');
  await page.waitForTimeout(500);
  const nodesAfterUndo = await page.$$('.react-flow__node');
  console.log('Nodes after undo:', nodesAfterUndo.length);

  // Redo with Ctrl+Shift+Z
  await page.keyboard.press('Control+Shift+z');
  await page.waitForTimeout(500);
  const nodesAfterRedo = await page.$$('.react-flow__node');
  console.log('Nodes after redo:', nodesAfterRedo.length);

  // Draw pencil stroke
  await page.click('[title*="Pencil"]');
  await page.waitForTimeout(300);
  if (canvas) {
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + 500, box.y + 150);
    await page.mouse.down();
    // Simulate curved stroke
    for (let i = 0; i <= 40; i++) {
      await page.mouse.move(
        box.x + 500 + i * 4,
        box.y + 150 + Math.sin(i / 5) * 40,
        { steps: 1 }
      );
    }
    await page.mouse.up();
    await page.waitForTimeout(500);
    console.log('Pencil stroke drawn');
  }

  await page.screenshot({ path: '/tmp/draw_final.png' });
  console.log('Screenshot 3: final saved');

  const finalNodes = await page.$$('.react-flow__node');
  console.log('Final node count:', finalNodes.length);

  // Test Ctrl+A select all
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  await page.keyboard.press('Control+a');
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/draw_select_all.png' });
  console.log('Screenshot 4: select-all saved');

  // Test zoom with mouse wheel (should work with any tool)
  await page.click('[title*="Rectangle"]');
  await page.waitForTimeout(200);
  if (canvas) {
    const box = await canvas.boundingBox();
    await page.mouse.wheel(0, -200); // zoom in
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: '/tmp/draw_zoom.png' });
  console.log('Screenshot 5: zoom saved');

  await browser.close();
  console.log('DONE');
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
