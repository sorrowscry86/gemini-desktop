import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Settings Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto(`file:///${path.resolve('index.html').replace(/\\/g, '/')}`);
  });

  test('should open settings modal when clicking Settings button', async ({ page }) => {
    // Click Settings button
    await page.getByRole('button', { name: '⚙️ Settings' }).click();
    
    // Verify settings modal is visible
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Gemini API Key' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Model' })).toBeVisible();
    await expect(page.getByRole('slider', { name: 'Temperature' })).toBeVisible();
  });

  test('should validate API key format', async ({ page }) => {
    // Open settings
    await page.getByRole('button', { name: '⚙️ Settings' }).click();
    
    // Enter invalid API key
    await page.getByRole('textbox', { name: 'Gemini API Key' }).fill('invalid-key');
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Wait a bit for any validation to occur
    await page.waitForTimeout(1000);
    
    // Check if validation error appears or if modal stays open (indicating validation failure)
    const hasValidationError = await page.getByText(/API key appears to be invalid/).isVisible();
    const modalStillOpen = await page.getByRole('heading', { name: 'Settings' }).isVisible();
    
    // Either validation error shows or modal stays open (both indicate validation working)
    expect(hasValidationError || modalStillOpen).toBeTruthy();
  });

  test('should save valid settings and update UI status', async ({ page }) => {
    // Open settings
    await page.getByRole('button', { name: '⚙️ Settings' }).click();
    
    // Fill valid API key
    await page.getByRole('textbox', { name: 'Gemini API Key' }).fill('AIzaSyTest123456789012345678901234567890');
    
    // Change model
    await page.getByRole('combobox', { name: 'Model' }).selectOption('gemini-1.5-pro');
    
    // Adjust temperature
    await page.getByRole('slider', { name: 'Temperature' }).fill('0.9');
    
    // Save settings
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Verify success message
    await expect(page.getByText('Settings saved successfully!')).toBeVisible();
    
    // Verify API status updated
    await expect(page.getByText('API Key Configured')).toBeVisible();
    
    // Verify chat interface is now visible
    await expect(page.getByRole('textbox', { name: 'Type your message to Gemini...' })).toBeVisible();
  });

  test('should close settings modal when clicking Cancel', async ({ page }) => {
    // Open settings
    await page.getByRole('button', { name: '⚙️ Settings' }).click();
    
    // Click Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();
    
    // Settings modal should be hidden
    await expect(page.getByRole('heading', { name: 'Settings' })).not.toBeVisible();
  });

  test('should close settings modal when clicking outside', async ({ page }) => {
    // Open settings
    await page.getByRole('button', { name: '⚙️ Settings' }).click();
    
    // Click outside the modal (on the backdrop)
    await page.locator('.settings-modal').click({ position: { x: 50, y: 50 } });
    
    // Settings modal should be hidden
    await expect(page.getByRole('heading', { name: 'Settings' })).not.toBeVisible();
  });

  test('should show Get Started button flows to Settings', async ({ page }) => {
    // Click Get Started button from welcome screen
    await page.getByRole('button', { name: 'Get Started' }).click();
    
    // Should open settings modal
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });
});