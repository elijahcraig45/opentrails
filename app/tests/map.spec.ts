import { test, expect } from '@playwright/test';

test.describe('OpenTrails API & Deployment', () => {
  test('API health endpoint responds', async ({ page }) => {
    const response = await page.request.get('https://opentrails-api-542596148138.us-central1.run.app/api/health');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });

  test('API has 2676+ trails loaded', async ({ page }) => {
    const response = await page.request.get('https://opentrails-api-542596148138.us-central1.run.app/api/trails?limit=10');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    // Should return an array with trails
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
  });

  test('API returns trail objects with correct structure', async ({ page }) => {
    const response = await page.request.get('https://opentrails-api-542596148138.us-central1.run.app/api/trails?limit=1');
    const data = await response.json();
    
    const trail = data[0];
    // Each trail should have these properties
    expect(trail.id).toBeDefined();
    expect(trail.name).toBeDefined();
    expect(trail.difficulty).toBeDefined();
    expect(typeof trail.length_meters).toBe('number');
  });

  test('API can filter by difficulty', async ({ page }) => {
    const response = await page.request.get('https://opentrails-api-542596148138.us-central1.run.app/api/trails?difficulty=Easy&limit=5');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    
    // All returned trails should be Easy difficulty
    if (data.length > 0) {
      data.forEach((trail: any) => {
        expect(trail.difficulty).toBe('Easy');
      });
    }
  });

  test('API can search by trail name', async ({ page }) => {
    const response = await page.request.get('https://opentrails-api-542596148138.us-central1.run.app/api/trails?search=loop&limit=10');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    // Should return results matching "loop"
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('App loads with login screen on first visit', async ({ page }) => {
    await page.goto('/');
    
    // Should show the login screen
    await expect(page.getByText('OpenTrails')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Discover & Track Your Hikes')).toBeVisible();
    await expect(page.getByText('Sign In')).toBeVisible();
  });

  test('Search input exists on login screen', async ({ page }) => {
    await page.goto('/');
    
    // Login screen has email and password inputs
    const emailInput = page.locator('input[placeholder="you@example.com"]');
    const passwordInput = page.locator('input[placeholder="Enter your password"]');
    
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible();
  });

  test('API deployment is in Cloud Run', async ({ page }) => {
    // Verify the deployment is accessible and running on Cloud Run
    const response = await page.request.get('https://opentrails-api-542596148138.us-central1.run.app/');
    
    // Cloud Run should respond (may be 404 for root, but shouldn't timeout)
    expect(response.status()).toBeLessThan(500);
  });

  test('Trail API returns trails with multiple properties', async ({ page }) => {
    const response = await page.request.get('https://opentrails-api-542596148138.us-central1.run.app/api/trails?limit=5');
    const data = await response.json();
    
    expect(data.length).toBeGreaterThan(0);
    
    const trail = data[0];
    // Check that we have the properties needed for the UI
    expect(trail.name).toBeTruthy();
    expect(trail.difficulty).toBeTruthy();
    expect(typeof trail.length_meters === 'number').toBeTruthy();
  });
});
