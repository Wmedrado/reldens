const { chromium } = require('playwright');

async function main() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const notFound = [];
    page.on('response', (res) => { if (res.status() === 404) notFound.push(res.url()); });

    try {
        await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);
        await page.click('#guest-form button[type="submit"]');
        await page.waitForTimeout(6000);
        const nameInput = await page.$('#new-player-name');
        if (nameInput) await nameInput.fill('TesteBug404');
        await page.waitForTimeout(500);
        const submitBtn = await page.$('#player-create-form button[type="submit"], #player-create-form input[type="submit"]');
        if (submitBtn) { await submitBtn.click(); }
        await page.waitForTimeout(8000);
        const canvas = await page.$('#reldens canvas');
        console.log('canvas:', !!canvas);
    } catch (e) { console.log('FLOW ERROR:', e.message); }

    console.log('\n===== 404 RESOURCES =====');
    const unique = [...new Set(notFound)];
    console.log(unique.length ? unique.join('\n') : '(none)');
    await browser.close();
}

main();
