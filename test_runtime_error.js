const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    await page.goto('file:///' + __dirname.replace(/\\/g, '/') + '/index.html', {waitUntil: 'networkidle2'});
    
    // Attempt to open the admin panel by injecting mock currentUser and calling syncUserUI or clicking the button
    await page.evaluate(async () => {
        window.currentUser = { email: 'admin@puntodulce.com' };
        window.SUPER_ADMINS = ['admin@puntodulce.com'];
        window.adminEmails = [];
        window.workerEmails = [];
        // Fake firebase
        window.firebase = {
            auth: () => ({
                currentUser: { email: 'admin@puntodulce.com', isAnonymous: false }
            })
        };
        
        if (typeof window.syncUserUI === 'function') {
            await window.syncUserUI();
        } else {
            console.error('syncUserUI not found');
        }
        
        // Try clicking admin button
        const btn = document.getElementById('nav-admin-panel');
        if (btn) {
            btn.click();
        } else {
            console.error('nav-admin-panel not found');
        }
    });
    
    await new Promise(r => setTimeout(r, 2000));
    await browser.close();
})();
