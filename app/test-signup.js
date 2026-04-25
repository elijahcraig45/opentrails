const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🔍 Testing OpenTrails signup flow...\n');
  
  await page.goto('https://opentrails.vercel.app', { waitUntil: 'networkidle', timeout: 45000 });
  
  // Get all buttons/links on login page
  const loginPageText = await page.locator('body').innerText();
  console.log('Login page shows:');
  console.log(`  - "Sign Up" text: ${loginPageText.includes('Sign Up')}`);
  console.log(`  - "Sign In" text: ${loginPageText.includes('Sign In')}`);
  
  // Try to click Sign Up
  try {
    const signUpLink = page.locator('a:has-text("Sign Up"), button:has-text("Sign Up"), div:has-text("Sign Up")').first();
    if (await signUpLink.count() > 0) {
      console.log('\n📝 Found Sign Up link, clicking...');
      await signUpLink.click();
      await page.waitForTimeout(1500);
    }
  } catch (e) {
    console.log(`Could not find Sign Up link: ${e.message}`);
  }
  
  // Check what we're on now
  const pageText = await page.locator('body').innerText();
  const inputs = await page.locator('input').count();
  
  console.log(`\n  Input fields found: ${inputs}`);
  console.log(`  Page contains "Password": ${pageText.includes('Password')}`);
  
  // If we have inputs, try to fill them
  if (inputs >= 3) {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'Test123!@#';
    const testName = 'Test User';
    
    console.log('\n📋 Filling signup form:');
    console.log(`  Name: ${testName}`);
    console.log(`  Email: ${testEmail}`);
    console.log(`  Password: ${testPassword}`);
    
    // Fill first 3 inputs (name, email, password)
    await page.locator('input').nth(0).fill(testName);
    await page.locator('input').nth(1).fill(testEmail);
    await page.locator('input').nth(2).fill(testPassword);
    
    await page.waitForTimeout(1000);
    
    // Look for any clickable button with text
    const buttons = await page.locator('text=Sign Up, text=Create Account, text=Continue').first();
    
    // Try clicking the first button on the page
    const allButtons = await page.locator('button');
    const btnCount = await allButtons.count();
    
    console.log(`\n  Buttons found: ${btnCount}`);
    
    if (btnCount > 0) {
      const firstBtn = allButtons.nth(btnCount - 1); // Last button is usually the main action
      const btnText = await firstBtn.innerText();
      console.log(`  Clicking button: "${btnText}"`);
      await firstBtn.click();
      
      await page.waitForTimeout(4000);
    }
  }
  
  // Final check
  const finalText = await page.locator('body').innerText();
  const hasTrailContent = finalText.includes('Trail') || finalText.includes('trail') || finalText.includes('Discover');
  const stillOnLogin = finalText.includes('Sign In') && finalText.includes('Password');
  
  console.log('\n🎯 Final Status:');
  console.log(`  Still on login: ${stillOnLogin}`);
  console.log(`  Has trail content: ${hasTrailContent}`);
  console.log(`  First 300 chars: ${finalText.substring(0, 300)}`);
  
  await browser.close();
})();
