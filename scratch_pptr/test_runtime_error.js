const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    const uri = 'file:///' + path.join(__dirname, '..', 'index.html').replace(/\\/g, '/');
    await page.goto(uri, {waitUntil: 'networkidle0'});
    
    await page.evaluate(async () => {
        window.currentUser = { email: 'admin@puntodulce.com', role: 'admin' };
        window.SUPER_ADMINS = ['admin@puntodulce.com'];
        window.adminEmails = ['admin@puntodulce.com'];
        window.workerEmails = [];
        window.firebase = {
            auth: () => ({
                currentUser: { email: 'admin@puntodulce.com', isAnonymous: false }
            })
        };
        
        if (typeof window.syncUserUI === 'function') {
            await window.syncUserUI();
        }
        
        if (typeof window.showSection === 'function') {
            window.showSection('admin-dashboard');
        }
    });
    
    await new Promise(r => setTimeout(r, 2000));
    await browser.close();
})();
