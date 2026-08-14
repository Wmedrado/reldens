const { chromium } = require('playwright');

async function main() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const errors = [];
    const logs = [];
    page.on('console', (msg) => {
        if (['error', 'warning'].includes(msg.type())) logs.push(`[console.${msg.type()}] ${msg.text()}`);
    });
    page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}\n${err.stack ? err.stack.split('\n').slice(0, 6).join('\n') : ''}`));
    page.on('requestfailed', (req) => errors.push(`[requestfailed] ${req.url()} -> ${req.failure()?.errorText}`));

    try {
        await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 30000 });
        console.log('PAGE LOADED. title:', await page.title());
        await page.waitForTimeout(3000);

        // try clicking the guest form submit (Jogar como Convidado)
        const guestBtn = await page.$('#guest-form button[type="submit"]');
        if (guestBtn) {
            console.log('guest form found, clicking submit...');
            await guestBtn.click();
            await page.waitForTimeout(8000);
        } else {
            console.log('guest submit button NOT found');
        }

        // check if game canvas appeared
        const canvas = await page.$('#reldens canvas');
        const gameVisible = await page.$eval('#reldens', (el) => getComputedStyle(el).display !== 'none').catch(() => false);
        console.log('canvas present:', !!canvas, '| #reldens visible:', gameVisible);
        const bodyText = (await page.$eval('body', (el) => el.innerText)).slice(0, 200).replace(/\n/g, ' | ');
        console.log('body text:', bodyText);
    } catch (e) {
        console.log('PAGE ERROR during flow:', e.message);
    }

    console.log('\n===== CONSOLE WARNINGS/ERRORS =====');
    console.log(logs.length ? logs.join('\n') : '(none)');
    console.log('\n===== PAGE ERRORS =====');
    console.log(errors.length ? errors.join('\n') : '(none)');
    await browser.close();
}

main();
