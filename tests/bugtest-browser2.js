const { chromium } = require('playwright');

async function main() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}\n${(err.stack || '').split('\n').slice(0, 8).join('\n')}`));
    page.on('console', (msg) => { if (['error', 'warning'].includes(msg.type())) errors.push(`[console.${msg.type()}] ${msg.text()}`); });

    try {
        await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);

        // guest
        await page.click('#guest-form button[type="submit"]');
        await page.waitForTimeout(6000);
        console.log('after guest click, visible text:', (await page.$eval('#player-selection', (el) => el.innerText).catch(() => '(no player-selection)')).slice(0, 120).replace(/\n/g, ' | '));

        // fill name
        const nameInput = await page.$('#new-player-name');
        if (nameInput) {
            await nameInput.fill('TesteBug');
            console.log('name filled');
        } else {
            console.log('name input NOT found');
        }
        await page.waitForTimeout(1000);

        // screenshot the state for diagnosis
        await page.screenshot({ path: 'tests/bugshot-1.png' });

        // dump all form fields present
        const fields = await page.$$eval('#player-selection input, #player-selection select, #player-selection option', (els) => els.slice(0, 30).map((el) => `${el.tagName}#${el.id || el.name}${el.selected ? ' [selected]' : ''}`));
        console.log('fields:', fields.join(' | '));

        // try submitting create form directly
        const createForm = await page.$('#player-create-form');
        if (createForm) {
            console.log('create form visible:', await createForm.isVisible());
            const submitBtn = await page.$('#player-create-form button[type="submit"], #player-create-form input[type="submit"]');
            if (submitBtn) {
                console.log('clicking create submit...');
                await submitBtn.click();
                await page.waitForTimeout(6000);
            }
        }
        const canvas = await page.$('#reldens canvas');
        console.log('canvas present after create:', !!canvas);
        await page.screenshot({ path: 'tests/bugshot-2.png' });
    } catch (e) {
        console.log('FLOW ERROR:', e.message);
    }
    console.log('\n===== ERRORS =====');
    console.log(errors.length ? errors.join('\n') : '(none)');
    await browser.close();
}

main();
