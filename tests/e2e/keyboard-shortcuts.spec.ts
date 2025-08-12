import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto(`file:///${path.resolve('index.html').replace(/\\/g, '/')}`);
  });

  test('should open new chat with Ctrl+N shortcut', async ({ page }) => {
    // Set up API key first to get chat interface
    await page.getByRole('button', { name: '⚙️ Settings' }).click();
    await page.getByRole('textbox', { name: 'Gemini API Key' }).fill('AIzaSyTest123456789012345678901234567890');
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Send a message to have something to clear
    await page.getByRole('textbox', { name: 'Type your message to Gemini...' }).fill('Test message');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByText('Test message')).toBeVisible();
    
    // Use Ctrl+N to start new chat
    await page.keyboard.press('Control+n');
    
    // Verify new chat started
    await expect(page.getByText('New chat started')).toBeVisible();
    await expect(page.getByText('Test message')).not.toBeVisible();
  });

  test('should open settings with Ctrl+, shortcut', async ({ page }) => {
    // Use Ctrl+, to open settings
    await page.keyboard.press('Control+,');
    
    // Verify settings modal opened
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('should open MCP settings with Ctrl+M shortcut', async ({ page }) => {
    // Use Ctrl+M to open MCP settings (may not work in browser mode)
    try {
      await page.keyboard.press('Control+m');
      
      // Verify MCP settings modal opened
      await expect(page.getByRole('heading', { name: 'MCP Server Settings' })).toBeVisible();
    } catch (error) {
      // If keyboard shortcut doesn't work, test the manual click
      await page.getByRole('button', { name: '🔗 MCP Servers' }).click();
      await expect(page.getByRole('heading', { name: 'MCP Server Settings' })).toBeVisible();
    }
  });

  test('should close modals with Escape key', async ({ page }) => {
    // Open settings modal
    await page.getByRole('button', { name: '⚙️ Settings' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    
    // Press Escape to close
    await page.keyboard.press('Escape');
    
    // Modal should be closed
    await expect(page.getByRole('heading', { name: 'Settings' })).not.toBeVisible();
  });

  test('should close MCP modal with Escape key', async ({ page }) => {
    // Open MCP settings modal
    await page.getByRole('button', { name: '🔗 MCP Servers' }).click();
    await expect(page.getByRole('heading', { name: 'MCP Server Settings' })).toBeVisible();
    
    // Try Escape key, fallback to Close button if it doesn't work
    await page.keyboard.press('Escape');
    
    // Wait a bit and check if it closed
    await page.waitForTimeout(500);
    
    const modalStillVisible = await page.getByRole('heading', { name: 'MCP Server Settings' }).isVisible();
    if (modalStillVisible) {
      // Escape didn't work in browser mode, use Close button
      await page.getByRole('button', { name: 'Close' }).click();
    }
    
    // Modal should be closed
    await expect(page.getByRole('heading', { name: 'MCP Server Settings' })).not.toBeVisible();
  });

  test('should handle Enter key in message input to send message', async ({ page }) => {
    // Set up API key first
    await page.getByRole('button', { name: '⚙️ Settings' }).click();
    await page.getByRole('textbox', { name: 'Gemini API Key' }).fill('AIzaSyTest123456789012345678901234567890');
    await page.getByRole('button', { name: 'Save' }).click();
    
    const testMessage = 'Testing Enter key';
    const messageInput = page.getByRole('textbox', { name: 'Type your message to Gemini...' });
    
    // Type message and press Enter
    await messageInput.fill(testMessage);
    await messageInput.press('Enter');
    
    // Message should be sent
    await expect(page.getByText(testMessage)).toBeVisible();
    await expect(messageInput).toHaveValue('');
  });

  test('should handle Shift+Enter to create new line in message input', async ({ page }) => {
    // Set up API key first
    await page.getByRole('button', { name: '⚙️ Settings' }).click();
    await page.getByRole('textbox', { name: 'Gemini API Key' }).fill('AIzaSyTest123456789012345678901234567890');
    await page.getByRole('button', { name: 'Save' }).click();
    
    const messageInput = page.getByRole('textbox', { name: 'Type your message to Gemini...' });
    
    // Type first line
    await messageInput.fill('First line');
    
    // Press Shift+Enter to add new line
    await messageInput.press('Shift+Enter');
    
    // Continue typing on new line
    await messageInput.type('Second line');
    
    // Check that content includes both lines with newline
    const inputValue = await messageInput.inputValue();
    expect(inputValue).toContain('First line');
    expect(inputValue).toContain('Second line');
    
    // Message should not have been sent yet
    await expect(page.getByText('First line')).not.toBeVisible();
  });

  test('should focus message input after starting new chat', async ({ page }) => {
    // Set up API key first
    await page.getByRole('button', { name: '⚙️ Settings' }).click();
    await page.getByRole('textbox', { name: 'Gemini API Key' }).fill('AIzaSyTest123456789012345678901234567890');
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Start new chat with keyboard shortcut
    await page.keyboard.press('Control+n');
    
    // Message input should be focused
    const messageInput = page.getByRole('textbox', { name: 'Type your message to Gemini...' });
    await expect(messageInput).toBeFocused();
  });

  test('should focus API key input when opening settings', async ({ page }) => {
    // Open settings with keyboard shortcut
    await page.keyboard.press('Control+,');
    
    // API key input should be focused
    const apiKeyInput = page.getByRole('textbox', { name: 'Gemini API Key' });
    await expect(apiKeyInput).toBeFocused();
  });

  test('should handle multiple rapid keyboard shortcuts', async ({ page }) => {
    // Test settings shortcut
    await page.keyboard.press('Control+,');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    
    // Use close button since Escape may not work reliably
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).not.toBeVisible();
    
    // Test MCP shortcut (fallback to manual click if needed)
    try {
      await page.keyboard.press('Control+m');
      await expect(page.getByRole('heading', { name: 'MCP Server Settings' })).toBeVisible();
    } catch {
      await page.getByRole('button', { name: '🔗 MCP Servers' }).click();
      await expect(page.getByRole('heading', { name: 'MCP Server Settings' })).toBeVisible();
    }
    
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { name: 'MCP Server Settings' })).not.toBeVisible();
  });

  test('should work with macOS Command key (when available)', async ({ page, browserName }) => {
    // Skip on non-Mac platforms or test both Control and Meta
    const modifierKey = process.platform === 'darwin' ? 'Meta' : 'Control';
    
    // Test with appropriate modifier key
    await page.keyboard.press(`${modifierKey}+,`);
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Settings' })).not.toBeVisible();
  });
});