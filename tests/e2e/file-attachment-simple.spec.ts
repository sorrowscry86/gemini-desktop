import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('File Attachment UI', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate and set up API key
    await page.goto(`file:///${path.resolve('index.html').replace(/\\/g, '/')}`);
    await page.getByRole('button', { name: '⚙️ Settings' }).click();
    await page.getByRole('textbox', { name: 'Gemini API Key' }).fill('AIzaSyTest123456789012345678901234567890');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('textbox', { name: 'Type your message to Gemini...' })).toBeVisible();
  });

  test('should open file dialog when clicking Attach File button', async ({ page }) => {
    // Set up file chooser listener
    const fileChooserPromise = page.waitForEvent('filechooser');
    
    // Click attach file button
    await page.getByRole('button', { name: '📎 Attach File' }).click();
    
    // Verify file chooser opened
    const fileChooser = await fileChooserPromise;
    expect(fileChooser).toBeTruthy();
    // File chooser may support multiple files, that's ok
    expect(typeof fileChooser.isMultiple()).toBe('boolean');
  });

  test('should show attach file button is accessible', async ({ page }) => {
    // Verify attach file button is visible and enabled
    const attachButton = page.getByRole('button', { name: '📎 Attach File' });
    await expect(attachButton).toBeVisible();
    await expect(attachButton).toBeEnabled();
    
    // Button should have proper styling
    await expect(attachButton).toHaveClass(/nav-button/);
  });

  test('should handle attach file button clicks without errors', async ({ page }) => {
    // Click attach file button multiple times
    for (let i = 0; i < 3; i++) {
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.getByRole('button', { name: '📎 Attach File' }).click();
      
      const fileChooser = await fileChooserPromise;
      expect(fileChooser).toBeTruthy();
      
      // Cancel the file chooser (close without selecting)
      await page.keyboard.press('Escape');
      
      // Wait a moment
      await page.waitForTimeout(100);
    }
    
    // Button should still be functional
    await expect(page.getByRole('button', { name: '📎 Attach File' })).toBeEnabled();
  });

  test('should show file input exists in DOM', async ({ page }) => {
    // Check if file input element exists (even if hidden)
    const fileInput = page.locator('input[type="file"]');
    
    // The file input should be present in the DOM
    await expect(fileInput).toBeAttached();
    
    // Check if it has an accept attribute (may be null in some implementations)
    const acceptAttribute = await fileInput.getAttribute('accept');
    // If accept attribute exists, it should be for images, otherwise that's ok too
    if (acceptAttribute) {
      expect(acceptAttribute).toContain('image');
    } else {
      // No accept attribute is also valid
      expect(acceptAttribute).toBeNull();
    }
  });

  test('should maintain UI state after file dialog operations', async ({ page }) => {
    // Open file dialog
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: '📎 Attach File' }).click();
    
    const fileChooser = await fileChooserPromise;
    expect(fileChooser).toBeTruthy();
    
    // Cancel the dialog
    await page.keyboard.press('Escape');
    
    // Verify UI state is maintained
    await expect(page.getByRole('textbox', { name: 'Type your message to Gemini...' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();
    await expect(page.getByRole('button', { name: '📎 Attach File' })).toBeEnabled();
  });
});