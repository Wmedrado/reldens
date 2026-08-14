const { chromium } = require('playwright');

async function main() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));
    page.on('console', (msg) => { if (['error', 'warning'].includes(msg.type())) errors.push(`[${msg.type()}] ${msg.text()}`); });
    page.on('requestfailed', (req) => errors.push(`[reqfail] ${req.url()} ${req.failure()?.errorText}`));

    try {
        await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1500);
        await page.click('#guest-form button[type="submit"]');
        await page.waitForTimeout(5000);
        const sceneSelect = await page.$('#creationSelectedScene');
        if (sceneSelect) {
            const opts = await sceneSelect.$$eval('option', (els) => els.map((o) => o.textContent.trim()));
            const idx = opts.findIndex((o) => /vibecraft/i.test(o));
            console.log('selecting scene index', idx, opts[idx]);
            if (idx > -1) await sceneSelect.selectOption({ index: idx });
        }
        await page.waitForTimeout(400);
        const nameInput = await page.$('#new-player-name');
        if (nameInput) { await nameInput.fill('BugTest' + Date.now().toString().slice(-4)); console.log('name filled'); }
        await page.waitForTimeout(300);
        const classSelect = await page.$('#class-path-select');
        if (classSelect && (await classSelect.$$eval('option', (o) => o.length)) > 1) {
            await classSelect.selectOption({ index: 1 });
            console.log('class selected');
        }
        await page.waitForTimeout(300);
        const submitBtn = await page.$('#player-create-form button[type="submit"], #player-create-form input[type="submit"]');
        if (submitBtn) { await submitBtn.click(); console.log('create submitted'); }
        await page.waitForTimeout(12000);
        const canvas = await page.$('#reldens canvas');
        console.log('canvas after create:', !!canvas);
        const hud = await page.$$eval('.game-container, #reldens', (els) => els.map((el) => el.innerText).join(' | ')).catch(() => '(n/a)');
        console.log('hud:', hud.slice(0, 200).replace(/\n/g, ' | '));
        // check hidden containers that should toggle
        const gameContainerHidden = await page.$eval('.game-container', (el) => el.classList.contains('hidden')).catch(() => 'n/a');
        const playerSelectionHidden = await page.$eval('#player-selection', (el) => el.classList.contains('hidden')).catch(() => 'n/a');
        console.log('game-container hidden:', gameContainerHidden, '| player-selection hidden:', playerSelectionHidden);
        await page.screenshot({ path: 'tests/bugshot-after.png' });
    } catch (e) { console.log('FLOW ERROR:', e.message); }

    console.log('\n===== ERRORS =====');
    console.log(errors.length ? errors.join('\n') : '(none)');
    await browser.close();
}

main();
