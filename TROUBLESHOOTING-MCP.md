# 🧘‍♂️ MCP Troubleshooting Guide - Debugging Like a Zen Master

Yo dude! Having MCP connection issues? Don't let it harsh your coding mellow! This guide will help you debug like a pro and get those connections flowing smoothly.

## Quick Diagnostic Commands

```bash
# Test your MCP server directly
npm run debug-mcp ws://localhost:8080

# Run app in debug mode
npm run dev:debug

# Check if your server is even running
netstat -an | findstr :8080
```

## Common Issues & Solutions

### 🔥 Issue: "No response from LLM" / Silent Failures

**What's happening:** Your MCP client is connecting but not getting responses, or failing silently.

**Debug steps:**
1. **Check server status:**
   ```bash
   npm run debug-mcp ws://your-server-url
   ```

2. **Look for these error codes:**
   - `MCP_001` (CONNECTION_TIMEOUT) - Server too slow to respond
   - `MCP_005` (REQUEST_TIMEOUT) - Individual requests timing out
   - `MCP_007` (INVALID_RESPONSE) - Server sending bad data

3. **Enable debug mode:**
   ```javascript
   // In your code, the client now auto-enables debug in development
   // Check console for detailed logs
   ```

**Solutions:**
- Increase timeouts in main.js (already set to 15s connection, 45s request)
- Verify server is actually running and responding
- Check server logs for errors
- Use the visual debug console to test interactively

### 🔥 Issue: Connection Timeouts

**Error codes:** `MCP_001`, `MCP_002`

**Debug steps:**
1. **Test basic connectivity:**
   ```bash
   # Windows
   telnet localhost 8080
   # Or use PowerShell
   Test-NetConnection -ComputerName localhost -Port 8080
   ```

2. **Check server startup time:**
   ```bash
   npm run debug-mcp ws://localhost:8080
   # Look for timing information in logs
   ```

**Solutions:**
- Server might be slow to start - wait longer or increase timeout
- Check firewall settings
- Verify correct port number
- Make sure server is binding to correct interface (0.0.0.0 vs 127.0.0.1)

### 🔥 Issue: Tool Calls Failing

**Error codes:** `MCP_008`, `MCP_006`

**Debug steps:**
1. **List available tools:**
   ```javascript
   const tools = await window.electronAPI.getMCPTools(serverId);
   console.log('Available tools:', tools);
   ```

2. **Use enhanced tool calling:**
   ```javascript
   const result = await window.electronAPI.callMCPToolEnhanced(
       serverId, 'tool-name', { arg: 'value' }
   );
   console.log('Detailed result:', result);
   ```

3. **Check tool exists and arguments:**
   - Tool name must match exactly
   - Arguments must match tool schema
   - Server must be connected

**Solutions:**
- Verify tool name spelling
- Check tool argument requirements
- Use diagnostic console to test tools interactively
- Run health check on server connection

### 🔥 Issue: WebSocket Errors

**Error codes:** `MCP_003`, `MCP_011`

**Debug steps:**
1. **Check WebSocket URL format:**
   ```javascript
   // Correct formats:
   ws://localhost:8080
   wss://secure-server.com:443
   
   // Wrong formats:
   http://localhost:8080  // ❌ Not WebSocket
   localhost:8080         // ❌ Missing protocol
   ```

2. **Test with curl or wscat:**
   ```bash
   # Install wscat if needed: npm install -g wscat
   wscat -c ws://localhost:8080
   ```

**Solutions:**
- Ensure URL starts with `ws://` or `wss://`
- Check server supports WebSocket connections
- Verify server is sending valid JSON-RPC messages

### 🔥 Issue: Initialization Failures

**Error codes:** `MCP_004`, `MCP_012`

**Debug steps:**
1. **Check MCP protocol version:**
   ```javascript
   // The client uses protocol version '2024-11-05'
   // Make sure your server supports this version
   ```

2. **Monitor initialization sequence:**
   ```bash
   npm run debug-mcp ws://localhost:8080
   # Watch for initialization request/response
   ```

**Solutions:**
- Update server to support MCP protocol version 2024-11-05
- Check server implements required MCP methods
- Verify server sends proper initialization response

## Using the Debug Tools

### 1. Command Line Testing
```bash
# Test any server
npm run debug-mcp ws://localhost:8080

# Test with custom arguments
node test-mcp-connection.js ws://your-server:port
```

### 2. Visual Debug Console
1. Run app in debug mode: `npm run dev:debug`
2. Click the "🧘‍♂️ MCP Debug" button (top-right in dev mode)
3. Or manually open `debug-mcp.html` in the app

### 3. Programmatic Debugging
```javascript
// Get detailed diagnostics
const diagnostics = await window.electronAPI.getMCPDiagnostics();
console.log('All connections:', diagnostics);

// Health check specific server
const health = await window.electronAPI.mcpHealthCheck(serverId);
console.log('Server health:', health);

// Enhanced error reporting
const result = await window.electronAPI.callMCPToolEnhanced(
    serverId, 'tool', args
);
if (!result.success) {
    console.error('Error code:', result.code);
    console.error('Error message:', result.error);
    console.error('Stack trace:', result.stack);
}
```

## Error Code Quick Reference

| Code | Issue | Quick Fix |
|------|-------|-----------|
| MCP_001 | Connection timeout | Check server is running, increase timeout |
| MCP_002 | Connection failed | Verify URL, check network/firewall |
| MCP_003 | WebSocket error | Check WebSocket support, server logs |
| MCP_004 | Init failed | Check MCP protocol compatibility |
| MCP_005 | Request timeout | Server slow, increase request timeout |
| MCP_006 | Not connected | Reconnect to server first |
| MCP_007 | Invalid response | Check server JSON-RPC format |
| MCP_008 | Tool call failed | Verify tool exists, check arguments |
| MCP_011 | Parse error | Server sending malformed JSON |
| MCP_012 | Discovery failed | Server not implementing MCP methods |

## Pro Tips for Debugging

### 1. **Layer Your Testing**
```bash
# 1. Test basic connectivity
telnet localhost 8080

# 2. Test WebSocket connection
wscat -c ws://localhost:8080

# 3. Test MCP protocol
npm run debug-mcp ws://localhost:8080

# 4. Test in app
npm run dev:debug
```

### 2. **Monitor Both Sides**
- Check client logs (Electron console)
- Check server logs (server console/files)
- Use network tools to see actual traffic

### 3. **Start Simple**
- Test with minimal server first
- Add complexity gradually
- Use known-good MCP servers for comparison

### 4. **Use the Diagnostics**
```javascript
// Regular health checks
setInterval(async () => {
    const health = await window.electronAPI.mcpHealthCheck(serverId);
    if (!health.healthy) {
        console.warn('Server unhealthy:', health.error);
    }
}, 30000);
```

## When All Else Fails

1. **Check the basics:**
   - Is the server actually running?
   - Is it listening on the right port?
   - Are there any firewall issues?

2. **Compare with working setup:**
   - Test against a known-good MCP server
   - Use the same configuration that worked before

3. **Enable maximum debugging:**
   ```bash
   set NODE_ENV=development
   set DEBUG=*
   npm run dev:debug
   ```

4. **Ask for help with context:**
   - Include error codes from debug output
   - Share server logs
   - Mention what you've already tried

Remember dude, debugging is just part of the journey! These tools will help you maintain your coding zen while figuring out what's going wrong. Don't let the errors kill your vibe - use them as stepping stones to understanding! 🧘‍♂️✨

Stay chill and debug on! 🌊