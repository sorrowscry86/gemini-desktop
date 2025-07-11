/**
 * Blackbox AI client to communicate with Claude Desktop via VSCode MCP Server.
 * Connects to SSE endpoint to receive JSON-RPC messages and sends requests via HTTP POST.
 */

const EventSourceLib = require('eventsource');
const fetch = require('node-fetch');

class BlackboxAIVSCodeComm {
  constructor(sseUrl, postUrl) {
    this.sseUrl = sseUrl;
    this.postUrl = postUrl;
    this.pendingRequests = new Map();
    this.requestId = 1;
    this.eventSource = null;
  }

  connect() {
    this.eventSource = new EventSourceLib(this.sseUrl);

    this.eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (err) {
        console.error('Failed to parse SSE message:', err);
      }
    };

    this.eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
      // Optionally implement reconnect logic here
    };

    console.log(`Connected to SSE at ${this.sseUrl}`);
  }

  async sendRequest(method, params = {}) {
    const id = this.requestId++;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    this.pendingRequests.set(id, request);

    try {
      const response = await fetch(this.postUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      this.handleResponse(data);
      return data;
    } catch (error) {
      console.error('Failed to send request:', error);
      this.pendingRequests.delete(id);
      throw error;
    }
  }

  handleMessage(message) {
    if (message.method && !message.id) {
      // Notification from server
      this.handleNotification(message);
    } else if (message.id) {
      // Response to a previous request
      this.handleResponse(message);
    } else {
      console.warn('Unknown message type:', message);
    }
  }

  handleResponse(response) {
    const { id, result, error } = response;
    if (this.pendingRequests.has(id)) {
      this.pendingRequests.delete(id);
      if (error) {
        console.error(`Error response for request ${id}:`, error);
      } else {
        console.log(`Response for request ${id}:`, result);
      }
    } else {
      console.warn(`Received response for unknown request id ${id}`);
    }
  }

  handleNotification(notification) {
    console.log('Received notification:', notification);
    // Here you can implement handling of directives from Claude Desktop
    // For example, dispatch commands or trigger actions in Blackbox AI
  }

  close() {
    if (this.eventSource) {
      this.eventSource.close();
      console.log('SSE connection closed');
    }
  }
}

// Usage example:
const sseUrl = 'http://127.0.0.1:6010/sse';
const postUrl = 'http://127.0.0.1:6010/call'; // Adjust if different

const blackboxComm = new BlackboxAIVSCodeComm(sseUrl, postUrl);
blackboxComm.connect();

// Example: send a tools/list request after 2 seconds
setTimeout(() => {
  blackboxComm.sendRequest('tools/list').catch(console.error);
}, 2000);

module.exports = BlackboxAIVSCodeComm;
