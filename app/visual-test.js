const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🔍 Navigating to https://opentrails.vercel.app...');
  await page.goto('https://opentrails.vercel.app', { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  // Collect all console messages
  const logs = { errors: [], warnings: [], logs: [] };
  page.on('console', msg => {
    if (msg.type() === 'error') logs.errors.push(msg.text());
    else if (msg.type() === 'warning') logs.warnings.push(msg.text());
    else logs.logs.push(msg.text());
  });
  
  // Check network errors
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`⚠️  HTTP ${response.status()}: ${response.url()}`);
    }
  });
  
  await page.waitForTimeout(3000);
  
  // Check page state
  const pageInfo = await page.evaluate(() => {
    const root = document.getElementById('root');
    const hasContent = root && root.innerText.length > 0;
    return {
      title: document.title,
      bodyClasses: document.body.className,
      rootExists: !!root,
      rootHasContent: hasContent,
      rootTextLength: root ? root.innerText.length : 0,
      rootText: root ? root.innerText.substring(0, 300) : 'no root'
    };
  });
  
  console.log('\n📄 Page Info:');
  console.log(JSON.stringify(pageInfo, null, 2));
  
  console.log('\n🛑 Errors:');
  if (logs.errors.length) logs.errors.forEach(e => console.log('  ERROR:', e));
  else console.log('  ✅ No console errors');
  
  console.log('\n⚠️  Warnings (first 3):');
  if (logs.warnings.length) logs.warnings.slice(0, 3).forEach(w => console.log('  WARN:', w));
  else console.log('  ✅ No warnings');
  
  // Try to find key UI elements
  const elements = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase();
    return {
      loginScreen: text.includes('login') || text.includes('sign up'),
      trailContent: text.includes('trail') || text.includes('boulder'),
      searchInput: !!document.querySelector('input[type="search"]') || !!document.querySelector('input[placeholder*="search"]'),
      mapContainer: !!document.querySelector('[class*="maplibre"]') || !!document.querySelector('[class*="map-container"]'),
      buttons: document.querySelectorAll('button').length,
      inputs: document.querySelectorAll('input').length,
      images: document.querySelectorAll('img').length,
    };
  });
  
  console.log('\n🔎 UI Elements Found:');
  console.log(JSON.stringify(elements, null, 2));
  
  // Try to interact - click any button we can find
  try {
    const buttonText = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.map(b => b.innerText).filter(t => t.length > 0);
    });
    console.log('\n🔘 Buttons Found:');
    buttonText.forEach(t => console.log(`  - ${t}`));
  } catch (e) {
    console.log('Could not inspect buttons');
  }
  
  await browser.close();
})();
