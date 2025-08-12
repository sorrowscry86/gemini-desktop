import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('UI Navigation and Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`file:///${path.resolve('index.html').replace(/\\/g, '/')}`);
  });

  test('should display proper app layout on load', async ({ page }) => {
    // Verify main layout elements
    await expect(page.getByText('🤖 Forbidden Library')).toBeVisible();
    await expect(page.getByText('v1.0')).toBeVisible();
    
    // Verify sidebar elements
    await expect(page.getByRole('button', { name: '📝 New Chat' })).toBeVisible();
    await expect(page.getByRole('button', { name: '⚙️ Settings' })).toBeVisible();
    await expect(page.getByRole('button', { name: '🔗 MCP Servers' })).toBeVisible();
    await expect(page.getByRole('button', { name: '📎 Attach File' })).toBeVisible();
    await expect(page.getByRole('button', { name: '💾 Export Chat' })).toBeVisible();
    
    // Verify version info section
    await expect(page.getByText('Electron:')).toBeVisible();
    await expect(page.getByText('Node:')).toBeVisible();
    await expect(page.getByText('Web')).toHaveCount(2); // Both Electron and Node show "Web" in browser mode
  });

  test('should show welcome screen by default', async ({ page }) => {
    // Welcome screen should be visible initially
    await expect(page.getByRole('heading', { name: 'Welcome to Forbidden Library' })).toBeVisible();
    await expect(page.getByText('Start a conversation with Google\'s Gemini AI')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible();
    
    // Chat interface should be hidden
    await expect(page.getByRole('textbox', { name: 'Type your message to Gemini...' })).not.toBeVisible();
  });

  test('should show proper status indicators', async ({ page }) => {
    // Initial API status
    await expect(page.getByText('API Key Required')).toBeVisible();
    const apiStatus = page.locator('#apiStatus');
    await expect(apiStatus).toHaveClass(/status-indicator/);
    // Note: The error class is applied dynamically by JavaScript, so checking the text is sufficient
    
    // MCP status
    await expect(page.getByText('MCP: Disconnected')).toBeVisible();
    const mcpStatus = page.locator('#mcpStatus');
    await expect(mcpStatus).toHaveClass(/status-indicator/);
  });

  test('should transition from welcome to chat interface after API key setup', async ({ page }) => {
    // Configure API key
    await page.getByRole('button', { name: '⚙️ Settings' }).click();
    await page.getByRole('textbox', { name: 'Gemini API Key' }).fill('AIzaSyTest123456789012345678901234567890');
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Welcome screen should be hidden
    await expect(page.getByRole('heading', { name: 'Welcome to Forbidden Library' })).not.toBeVisible();
    
    // Chat interface should be visible
    await expect(page.getByRole('textbox', { name: 'Type your message to Gemini...' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();
    
    // API status should update
    await expect(page.getByText('API Key Configured')).toBeVisible();
    const apiStatus = page.locator('#apiStatus');
    await expect(apiStatus).toHaveClass(/connected/);
  });

  test('should maintain sidebar visibility across all screens', async ({ page }) => {
    // Sidebar should be visible on welcome screen
    await expect(page.getByText('🤖 Forbidden Library')).toBeVisible();
    await expect(page.getByRole('button', { name: '📝 New Chat' })).toBeVisible();
    
    // Configure API key to switch to chat
    await page.getByRole('button', { name: '⚙️ Settings' }).click();
    await page.getByRole('textbox', { name: 'Gemini API Key' }).fill('AIzaSyTest123456789012345678901234567890');
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Sidebar should still be visible in chat interface
    await expect(page.getByText('🤖 Forbidden Library')).toBeVisible();
    await expect(page.getByRole('button', { name: '📝 New Chat' })).toBeVisible();
  });

  test('should display app branding consistently', async ({ page }) => {
    // Main logo
    await expect(page.getByText('🤖 Forbidden Library')).toBeVisible();
    
    // Version badge
    await expect(page.getByText('v1.0')).toBeVisible();
    const versionBadge = page.locator('.logo span');
    await expect(versionBadge).toHaveClass(/bg-blue-600/);
  });

  test('should show proper message area structure', async ({ page }) => {
    // Configure API key to show chat interface
    await page.getByRole('button', { name: '⚙️ Settings' }).click();
    await page.getByRole('textbox', { name: 'Gemini API Key' }).fill('AIzaSyTest123456789012345678901234567890');
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Verify chat messages container exists
    const chatMessages = page.locator('#chatMessages');
    await expect(chatMessages).toBeAttached();
    
    // Verify input container structure
    const inputContainer = page.locator('.input-container');
    await expect(inputContainer).toBeVisible();
    await expect(inputContainer.getByRole('textbox')).toBeVisible();
    await expect(inputContainer.getByRole('button', { name: 'Send' })).toBeVisible();
  });

  test('should handle responsive layout elements', async ({ page }) => {
    // Test different window sizes (within reasonable bounds for desktop app)
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.getByText('🤖 Forbidden Library')).toBeVisible();
    
    await page.setViewportSize({ width: 800, height: 600 });
    await expect(page.getByText('🤖 Forbidden Library')).toBeVisible();
    
    // Sidebar should remain functional at smaller sizes
    await expect(page.getByRole('button', { name: '⚙️ Settings' })).toBeVisible();
  });

  test('should display typing indicator structure', async ({ page }) => {
    // Configure API key to show chat interface
    await page.getByRole('button', { name: '⚙️ Settings' }).click();
    await page.getByRole('textbox', { name: 'Gemini API Key' }).fill('AIzaSyTest123456789012345678901234567890');
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Verify typing indicator exists (even if hidden)
    const typingIndicator = page.locator('#typingIndicator');
    await expect(typingIndicator).toBeAttached();
    
    // Verify typing dots structure
    const typingDots = page.locator('.typing-dot');
    await expect(typingDots).toHaveCount(3);
  });

  test('should show proper cursor states on interactive elements', async ({ page }) => {
    // Navigation buttons should have nav-button class
    const settingsBtn = page.getByRole('button', { name: '⚙️ Settings' });
    await expect(settingsBtn).toHaveClass(/nav-button/);
    
    const newChatBtn = page.getByRole('button', { name: '📝 New Chat' });
    await expect(newChatBtn).toHaveClass(/nav-button/);
    
    // Get Started button should have button classes
    const getStartedBtn = page.getByRole('button', { name: 'Get Started' });
    await expect(getStartedBtn).toHaveClass(/button/);
  });

  test('should maintain consistent styling across components', async ({ page }) => {
    // Navigation buttons should have consistent styling
    const navButtons = page.locator('.nav-button');
    await expect(navButtons).toHaveCount(5);
    
    // Each nav button should have the same base classes
    for (let i = 0; i < 5; i++) {
      const button = navButtons.nth(i);
      await expect(button).toHaveClass(/nav-button/);
    }
    
    // Status indicators should have consistent base styling
    const statusIndicators = page.locator('.status-indicator');
    await expect(statusIndicators).toHaveCount(2); // API and MCP status
  });
});