const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🔍 Navigating to https://opentrails.vercel.app...');
  await page.goto('https://opentrails.vercel.app', { waitUntil: 'networkidle', timeout: 45000 });
  
  // Wait for JS to execute
  await page.waitForTimeout(5000);
  
  // Get full HTML to see structure
  const html = await page.content();
  const hasReactScript = html.includes('index') && html.includes('expo');
  
  console.log(`✅ React/Expo bundles loaded: ${hasReactScript}`);
  console.log(`📏 HTML size: ${html.length} bytes`);
  console.log(`🔗 Has maplibre CSS: ${html.includes('maplibre-gl')}`);
  
  // Try to find the app structure
  const appStructure = await page.evaluate(() => {
    const root = document.getElementById('root');
    const scripts = Array.from(document.querySelectorAll('script')).map(s => ({
      src: s.src.substring(s.src.lastIndexOf('/') + 1) || 'inline',
      type: s.type
    }));
    
    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => 
      l.href.substring(l.href.lastIndexOf('/') + 1)
    );
    
    return {
      rootChildren: root ? root.children.length : 0,
      rootHTML: root ? root.innerHTML.substring(0, 500) : 'no root',
      scriptsLoaded: scripts.length,
      stylesheets: stylesheets.slice(0, 5),
    };
  });
  
  console.log('\n📦 App Structure:');
  console.log(JSON.stringify(appStructure, null, 2));
  
  // Check if we can skip login
  const canBypass = await page.evaluate(() => {
    const loginBtn = document.querySelector('button');
    const skipLink = Array.from(document.querySelectorAll('a, button, div'))
      .find(el => el.innerText.includes('explore') || el.innerText.includes('Continue'));
    return {
      hasLoginBtn: !!loginBtn,
      hasSkipOption: !!skipLink,
      loginBtnText: loginBtn ? loginBtn.innerText : 'none',
      skipText: skipLink ? skipLink.innerText : 'none'
    };
  });
  
  console.log('\n🔐 Login Status:');
  console.log(JSON.stringify(canBypass, null, 2));
  
  // Try clicking "Continue to explore trails"
  const clickable = await page.locator('text=Continue to explore trails while logged out').first();
  if (await clickable.count() > 0) {
    console.log('\n✅ Found bypass text, clicking...');
    await clickable.click();
    await page.waitForTimeout(2000);
  }
  
  // Check page after action
  const afterClick = await page.evaluate(() => {
    return {
      title: document.title,
      hasTrails: document.body.innerText.includes('trail'),
      hasMap: !!document.querySelector('[class*="map"]'),
      text: document.body.innerText.substring(0, 400)
    };
  });
  
  console.log('\n📋 After Interaction:');
  console.log(JSON.stringify(afterClick, null, 2));
  
  await browser.close();
})();
