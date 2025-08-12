import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe.skip('File Attachment', () => {
  let testImagePath: string;
  
  test.beforeAll(async () => {
    // Set the test image path
    testImagePath = path.resolve('test-image.png');
  });

  test.afterAll(async () => {
    // Clean up test file
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  });

  test.beforeEach(async ({ page }) => {
    // Create test image file for each test
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      'base64'
    );
    
    try {
      fs.writeFileSync(testImagePath, testImageBuffer);
    } catch (error) {
      console.error('Failed to create test image:', error);
    }
    
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
  });

  test('should attach and display image file with preview', async ({ page }) => {
    // Set up file chooser
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: '📎 Attach File' }).click();
    const fileChooser = await fileChooserPromise;
    
    // Select test image
    await fileChooser.setFiles([testImagePath]);
    
    // Verify file preview appears
    await expect(page.getByRole('img', { name: 'test-image.png' })).toBeVisible();
    await expect(page.getByText('test-image.png')).toBeVisible();
    await expect(page.getByText(/Bytes/)).toBeVisible();
    
    // Verify remove button is present
    await expect(page.getByRole('button', { name: '×' })).toBeVisible();
  });

  test('should remove attached file when clicking remove button', async ({ page }) => {
    // Attach a file first
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: '📎 Attach File' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([testImagePath]);
    
    // Verify file is attached
    await expect(page.getByRole('img', { name: 'test-image.png' })).toBeVisible();
    
    // Click remove button
    await page.getByRole('button', { name: '×' }).click();
    
    // Verify file preview is removed
    await expect(page.getByRole('img', { name: 'test-image.png' })).not.toBeVisible();
    await expect(page.getByText('test-image.png')).not.toBeVisible();
  });

  test('should show file attachment container when file is attached', async ({ page }) => {
    // Initially, attachment container should not be visible
    const attachmentContainer = page.locator('.attached-files-container');
    await expect(attachmentContainer).not.toBeVisible();
    
    // Attach a file
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: '📎 Attach File' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([testImagePath]);
    
    // Attachment container should now be visible
    await expect(attachmentContainer).toBeVisible();
  });

  test('should send message with attached file', async ({ page }) => {
    // Attach file
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: '📎 Attach File' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([testImagePath]);
    
    // Verify file is attached
    await expect(page.getByRole('img', { name: 'test-image.png' })).toBeVisible();
    
    // Type and send message
    const testMessage = 'Please analyze this image';
    await page.getByRole('textbox', { name: 'Type your message to Gemini...' }).fill(testMessage);
    await page.getByRole('button', { name: 'Send' }).click();
    
    // Verify message appears in chat
    await expect(page.getByText(testMessage)).toBeVisible();
    
    // Note: In browser mode, the file attachment won't actually be processed by Gemini API,
    // but we can verify the UI flow works correctly
  });

  test('should handle multiple file selections (UI behavior)', async ({ page }) => {
    // Create another test file
    const testImagePath2 = path.resolve('test-image-2.png');
    fs.writeFileSync(testImagePath2, Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    ));
    
    try {
      // Attach first file
      let fileChooserPromise = page.waitForEvent('filechooser');
      await page.getByRole('button', { name: '📎 Attach File' }).click();
      let fileChooser = await fileChooserPromise;
      await fileChooser.setFiles([testImagePath]);
      
      // Verify first file attached
      await expect(page.getByRole('img', { name: 'test-image.png' })).toBeVisible();
      
      // Try to attach second file (this will replace the first in current implementation)
      fileChooserPromise = page.waitForEvent('filechooser');
      await page.getByRole('button', { name: '📎 Attach File' }).click();
      fileChooser = await fileChooserPromise;
      await fileChooser.setFiles([testImagePath2]);
      
      // Verify the UI handles the file replacement appropriately
      await expect(page.getByText('test-image-2.png')).toBeVisible();
      
    } finally {
      // Clean up
      if (fs.existsSync(testImagePath2)) {
        fs.unlinkSync(testImagePath2);
      }
    }
  });
});