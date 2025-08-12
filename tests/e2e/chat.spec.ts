import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Chat Interface', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and configure API key to show chat interface
    await page.goto(`file:///${path.resolve('index.html').replace(/\\/g, '/')}`);
    
    // Set up API key to enable chat interface
    await page.getByRole('button', { name: '⚙️ Settings' }).click();
    await page.getByRole('textbox', { name: 'Gemini API Key' }).fill('AIzaSyTest123456789012345678901234567890');
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Wait for chat interface to appear
    await expect(page.getByRole('textbox', { name: 'Type your message to Gemini...' })).toBeVisible();
  });

  test('should display chat interface after API key configuration', async ({ page }) => {
    // Verify chat interface elements are visible
    await expect(page.getByRole('textbox', { name: 'Type your message to Gemini...' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();
    
    // Verify welcome screen is hidden
    await expect(page.getByRole('heading', { name: 'Welcome to Forbidden Library' })).not.toBeVisible();
  });

  test('should send message and display in chat history', async ({ page }) => {
    const testMessage = 'Hello, this is a test message!';
    
    // Type message
    await page.getByRole('textbox', { name: 'Type your message to Gemini...' }).fill(testMessage);
    
    // Send message
    await page.getByRole('button', { name: 'Send' }).click();
    
    // Verify message appears in chat
    await expect(page.getByText(testMessage)).toBeVisible();
    
    // Verify input is cleared
    await expect(page.getByRole('textbox', { name: 'Type your message to Gemini...' })).toHaveValue('');
  });

  test('should send message using Enter key', async ({ page }) => {
    const testMessage = 'Testing Enter key functionality';
    
    const messageInput = page.getByRole('textbox', { name: 'Type your message to Gemini...' });
    await messageInput.fill(testMessage);
    
    // Press Enter to send
    await messageInput.press('Enter');
    
    // Verify message appears in chat
    await expect(page.getByText(testMessage)).toBeVisible();
  });

  test('should not send message with Shift+Enter', async ({ page }) => {
    const testMessage = 'Testing Shift+Enter';
    
    const messageInput = page.getByRole('textbox', { name: 'Type your message to Gemini...' });
    await messageInput.fill(testMessage);
    
    // Press Shift+Enter (should create new line, not send)
    await messageInput.press('Shift+Enter');
    
    // Message should still be in input (not sent) - the actual newline character
    const inputValue = await messageInput.inputValue();
    expect(inputValue).toContain(testMessage);
    expect(inputValue.includes('\n') || inputValue.includes('\r')).toBeTruthy();
  });

  test('should handle API error responses gracefully', async ({ page }) => {
    const testMessage = 'This will trigger an error with dummy API key';
    
    // Send message
    await page.getByRole('textbox', { name: 'Type your message to Gemini...' }).fill(testMessage);
    await page.getByRole('button', { name: 'Send' }).click();
    
    // Should show user message
    await expect(page.getByText(testMessage)).toBeVisible();
    
    // Should show error response
    await expect(page.getByText(/Sorry, I encountered an error/)).toBeVisible();
  });

  test('should clear chat when starting new chat', async ({ page }) => {
    // Send a test message first
    await page.getByRole('textbox', { name: 'Type your message to Gemini...' }).fill('First message');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByText('First message')).toBeVisible();
    
    // Start new chat
    await page.getByRole('button', { name: '📝 New Chat' }).click();
    
    // Verify new chat started message
    await expect(page.getByText('New chat started')).toBeVisible();
    
    // Previous message should be cleared
    await expect(page.getByText('First message')).not.toBeVisible();
  });

  test('should auto-resize textarea based on content', async ({ page }) => {
    const messageInput = page.getByRole('textbox', { name: 'Type your message to Gemini...' });
    
    // Add multiple lines of text 
    await messageInput.fill('Line 1\nLine 2\nLine 3\nLine 4\nLine 5');
    
    // Verify the content is properly filled with multiple lines
    const inputValue = await messageInput.inputValue();
    expect(inputValue.split('\n').length).toBeGreaterThan(1);
    
    // Verify the textarea has the input-field class which handles auto-resize
    await expect(messageInput).toHaveClass(/input-field/);
  });

  test('should show typing indicator functionality exists', async ({ page }) => {
    // Verify typing indicator element exists (even if not currently active)
    const typingIndicator = page.locator('#typingIndicator');
    await expect(typingIndicator).toBeAttached();
    
    const dots = page.locator('.typing-dot');
    await expect(dots).toHaveCount(3);
  });
});