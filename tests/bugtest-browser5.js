const { chromium } = require('playwright');

async function main() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`[console.error] ${msg.text()}`); });
    let serverAlive = true;
    page.on('close', () => {});

    try {
        await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1500);
        // login form with invalid creds
        await page.fill('#username', 'naoexiste-user');
        await page.fill('#password', 'senha-errada');
        await page.click('#login-form button[type="submit"]');
        await page.waitForTimeout(6000);
        const errText = await page.$$eval('.response-error', (els) => els.map((el) => el.innerText.trim()).filter(Boolean));
        console.log('response-error texts:', errText.join(' | ') || '(empty)');
        const bodySnippet = (await page.$eval('body', (el) => el.innerText)).slice(0, 150).replace(/\n/g, ' | ');
        console.log('body:', bodySnippet);
    } catch (e) { console.log('FLOW ERROR:', e.message); }

    // check server still alive
    try {
        const r = await require('node:http').get('http://localhost:8080', (res) => { res.resume(); console.log('SERVER STILL ALIVE after bad login:', res.statusCode); }).on('error', () => console.log('SERVER DOWN after bad login'));
    } catch (e) { console.log('server check err'); }

    console.log('\n===== ERRORS =====');
    console.log(errors.length ? errors.join('\n') : '(none)');
    await browser.close();
}

main();
