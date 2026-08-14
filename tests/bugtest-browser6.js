const { chromium } = require('playwright');

async function main() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`[console.error] ${msg.text()}`); });

    try {
        await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1500);
        await page.click('#guest-form button[type="submit"]');
        await page.waitForTimeout(5000);
        const sceneSelect = await page.$('#creationSelectedScene');
        if (sceneSelect) {
            const opts = await sceneSelect.$$eval('option', (els) => els.map((o) => o.textContent.trim()));
            const idx = opts.findIndex((o) => /vibecraft/i.test(o));
            if (idx > -1) await sceneSelect.selectOption({ index: idx });
        }
        await page.waitForTimeout(400);
        const nameInput = await page.$('#new-player-name');
        if (nameInput) await nameInput.fill('MovTest');
        await page.waitForTimeout(300);
        const classSelect = await page.$('#class-path-select');
        if (classSelect && (await classSelect.$$eval('option', (o) => o.length)) > 1) await classSelect.selectOption({ index: 1 });
        const submitBtn = await page.$('#player-create-form button[type="submit"], #player-create-form input[type="submit"]');
        if (submitBtn) await submitBtn.click();
        await page.waitForTimeout(10000);
        const canvas = await page.$('#reldens canvas');
        console.log('canvas:', !!canvas);
        if (canvas) {
            // hold the D key (right) for 3s to walk
            await page.keyboard.down('d');
            await page.waitForTimeout(3000);
            await page.keyboard.up('d');
            await page.waitForTimeout(2000);
            console.log('moved right for 3s');
        }
        await page.screenshot({ path: 'tests/bugshot-move.png' });
    } catch (e) { console.log('FLOW ERROR:', e.message); }

    console.log('\n===== ERRORS =====');
    console.log(errors.length ? errors.join('\n') : '(none)');
    await browser.close();
}

main();
