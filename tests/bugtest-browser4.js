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
        // choose the vibecraft demo scene
        const sceneSelect = await page.$('#creationSelectedScene');
        if (sceneSelect) {
            const opts = await sceneSelect.$$eval('option', (els) => els.map((o) => o.textContent.trim()));
            console.log('scene options:', opts.join(' | '));
            await sceneSelect.selectOption({ label: 'Vibecraft Demo' }).catch(async () => {
                // fallback: try selecting by index of option containing vibecraft
                const idx = opts.findIndex((o) => /vibecraft/i.test(o));
                if (idx > -1) await sceneSelect.selectOption({ index: idx });
            });
            console.log('scene selected');
        }
        await page.waitForTimeout(500);
        const nameInput = await page.$('#new-player-name');
        if (nameInput) { await nameInput.fill('TesteVibe'); console.log('name filled'); }
        await page.waitForTimeout(500);
        // select a class path if required
        const classSelect = await page.$('#class-path-select');
        if (classSelect) {
            const opts = await classSelect.$$eval('option', (els) => els.map((o) => o.textContent.trim()));
            console.log('class options:', opts.join(' | '));
            if (opts.length > 1) await classSelect.selectOption({ index: 1 });
        }
        await page.waitForTimeout(300);
        const submitBtn = await page.$('#player-create-form button[type="submit"], #player-create-form input[type="submit"]');
        if (submitBtn) { await submitBtn.click(); console.log('create submitted'); }
        await page.waitForTimeout(10000);
        const canvas = await page.$('#reldens canvas');
        console.log('canvas:', !!canvas);
        await page.screenshot({ path: 'tests/bugshot-game.png' });
        // dump hud text
        const hudText = await page.$$eval('#reldens, .game-container', (els) => els.map((el) => el.innerText).join(' | ')).catch(() => '(no hud)');
        console.log('hud text:', hudText.slice(0, 300).replace(/\n/g, ' | '));
    } catch (e) { console.log('FLOW ERROR:', e.message); }

    console.log('\n===== ERRORS =====');
    console.log(errors.length ? errors.join('\n') : '(none)');
    await browser.close();
}

main();
