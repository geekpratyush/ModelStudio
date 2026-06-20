const puppeteer = require('puppeteer');
const click = async (page, rx, maxLen = 40) => page.evaluate((rxs, maxLen) => {
  const re = new RegExp(rxs, 'i');
  const el = [...document.querySelectorAll('button, a, [role=button]')]
    .find(e => re.test((e.textContent || '').trim()) && (e.textContent || '').trim().length <= maxLen);
  if (el) { el.click(); return (el.textContent || '').trim(); }
  return null;
}, rx, maxLen);

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('workspace', 'dac'); } catch {} });
  await page.goto('http://localhost:5174/ModelStudio/', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 800));
  await click(page, 'launch studio');
  await new Promise(r => setTimeout(r, 1500));

  const names = ["Sequence Diagram","Class Diagram","State Diagram","ER Diagram","User Journey","Gantt Chart","Pie Chart","Requirement Diagram","Git Graph","C4 Context","C4 Container","C4 Component","C4 Dynamic","C4 Deployment","Mindmap","Timeline","Quadrant Chart","XY Chart","Block Diagram","Packet Diagram","Architecture Diagram","Sankey Diagram","Kanban Board","Radar Chart"];

  for (const name of names) {
    await click(page, '^templates$|template', 20);
    await new Promise(r => setTimeout(r, 500));
    const ok = await page.evaluate((name) => {
      const c = [...document.querySelectorAll('.dac-template-card')]
        .find(c => new RegExp('^'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$','i').test(c.querySelector('.dac-template-card-name')?.textContent.trim() || ''));
      if (c) { c.click(); return true; } return false;
    }, name);
    await new Promise(r => setTimeout(r, 1400));
    const res = await page.evaluate(() => {
      const svg = document.querySelector('.mmd-svg svg');
      const err = document.querySelector('.mmd-error');
      const empty = document.querySelector('.mmd-empty');
      return {
        svg: svg ? `${Math.round(svg.getBoundingClientRect().width)}x${Math.round(svg.getBoundingClientRect().height)}` : null,
        error: err ? err.textContent.replace('Syntax error','').trim() : null,
        empty: !!empty,
      };
    });
    console.log(`${name.padEnd(22)} | svg=${String(res.svg).padEnd(10)} | empty=${res.empty} | err=${res.error || '-'}`);
  }
  await browser.close();
})();
