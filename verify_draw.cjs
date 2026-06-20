const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1600, height: 900 });
  
  await page.goto('http://localhost:5174/ModelStudio/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('workspace', 'draw');
    localStorage.setItem('hasVisited', 'true');
  });
  
  const openBtn = page.locator('button:has-text("Open Studio"), a:has-text("Open Studio")').first();
  if (await openBtn.count() > 0) await openBtn.click();
  else await page.locator('button:has-text("Launch Studio")').first().click();
  await page.waitForTimeout(2500);
  
  await page.screenshot({ path: '/tmp/draw_workspace.png' });
  
  // Workspace should already be Draw - confirm
  const wsText = await page.evaluate(() => localStorage.getItem('workspace'));
  console.log('Workspace in localStorage:', wsText);
  
  // Verify toolbar elements
  const undoTitle = await page.$('[title="Undo (Ctrl+Z)"]');
  const redoTitle = await page.$('[title="Redo (Ctrl+Shift+Z)"]');
  const eraserTitle = await page.$('[title="Eraser (E)"]');
  const lockBtn = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).some(b => 
      b.title?.includes('locked') || b.title?.includes('unlocked'));
  });
  console.log('Undo:', !!undoTitle, 'Redo:', !!redoTitle, 'Eraser:', !!eraserTitle, 'Lock:', lockBtn);

  const colorInputs = await page.$$('input[type="color"]');
  const rangeInputs = await page.$$('input[type="range"]');
  console.log('Color inputs:', colorInputs.length, '(expect >=2) | Range inputs:', rangeInputs.length, '(expect >=3)');

  // Draw a rectangle using force click
  await page.locator('[title*="Rectangle (R"]').first().dispatchEvent('click');
  await page.waitForTimeout(300);

  const canvas = page.locator('.react-flow__pane').first();
  await canvas.waitFor({ timeout: 5000 });
  const box = await canvas.boundingBox();
  console.log('Canvas available, box:', !!box);

  if (box) {
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 380, box.y + 310, { steps: 15 });
    await page.mouse.up();
    await page.waitForTimeout(600);
  }

  await page.screenshot({ path: '/tmp/draw_after_rect.png' });
  const nodes1 = await page.$$('.react-flow__node');
  console.log('Nodes after rect:', nodes1.length);

  // Undo
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  await page.keyboard.press('Control+z');
  await page.waitForTimeout(500);
  const nodes2 = await page.$$('.react-flow__node');
  console.log('Nodes after Ctrl+Z:', nodes2.length, '(undo worked:', nodes2.length < nodes1.length, ')');

  // Redo  
  await page.keyboard.press('Control+Shift+z');
  await page.waitForTimeout(500);
  const nodes3 = await page.$$('.react-flow__node');
  console.log('Nodes after Ctrl+Shift+Z:', nodes3.length, '(redo worked:', nodes3.length > nodes2.length, ')');

  // Select all
  await page.keyboard.press('Control+a');
  await page.waitForTimeout(400);
  const selected = await page.$$('.react-flow__node.selected');
  console.log('Selected after Ctrl+A:', selected.length);

  // Pencil stroke
  await page.locator('[title*="Pencil"]').first().dispatchEvent('click');
  await page.waitForTimeout(300);
  if (box) {
    await page.mouse.move(box.x + 500, box.y + 150);
    await page.mouse.down();
    for (let i = 0; i <= 50; i++) {
      await page.mouse.move(box.x + 500 + i * 4, box.y + 150 + Math.sin(i / 6) * 50);
    }
    await page.mouse.up();
    await page.waitForTimeout(600);
  }

  const nodes4 = await page.$$('.react-flow__node');
  console.log('Nodes after pencil:', nodes4.length);

  // Check bezier path in drawing nodes
  const paths = await page.$$('.react-flow__node path[stroke-linecap="round"]');
  console.log('Drawing paths found:', paths.length);
  for (const p of paths) {
    const d = await p.getAttribute('d');
    if (d && d.length > 30) {
      console.log('Uses bezier (C command):', d.includes(' C '));
      console.log('Path d snippet:', d.substring(0, 80));
      break;
    }
  }

  await page.screenshot({ path: '/tmp/draw_pencil.png' });

  // Zoom while rect tool active (should work now)
  await page.locator('[title*="Rectangle (R"]').first().dispatchEvent('click');
  await page.waitForTimeout(200);
  const vp1 = await page.evaluate(() => document.querySelector('.react-flow__viewport')?.style.transform);
  if (box) {
    await page.mouse.move(box.x + 400, box.y + 300);
    await page.mouse.wheel(0, -400);
  }
  await page.waitForTimeout(400);
  const vp2 = await page.evaluate(() => document.querySelector('.react-flow__viewport')?.style.transform);
  const z1 = vp1?.match(/scale\(([^)]+)\)/)?.[1];
  const z2 = vp2?.match(/scale\(([^)]+)\)/)?.[1];
  console.log('Zoom works while rect tool:', z1 !== z2, '| before:', z1, 'after:', z2);

  // Ctrl+C, Ctrl+V copy-paste
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  await page.keyboard.press('Control+a');
  await page.waitForTimeout(300);
  const preCount = (await page.$$('.react-flow__node')).length;
  await page.keyboard.press('Control+c');
  await page.waitForTimeout(200);
  await page.keyboard.press('Control+v');
  await page.waitForTimeout(500);
  const postCount = (await page.$$('.react-flow__node')).length;
  console.log('Copy-paste: before:', preCount, 'after:', postCount, '(doubled:', postCount > preCount, ')');

  await page.screenshot({ path: '/tmp/draw_final.png' });
  
  await browser.close();
  console.log('DONE');
})().catch(e => { console.error('ERROR:', e.stack); process.exit(1); });
