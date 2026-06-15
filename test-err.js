import puppeteer from 'puppeteer';
(async () => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('PAGE ERROR:', msg.text());
        }
    });
    page.on('pageerror', err => {
        console.log('PAGE EXCEPTION:', err.toString());
    });
    await page.goto('http://localhost:5173/');
    await new Promise(r => setTimeout(r, 1000));
    await browser.close();
})();
