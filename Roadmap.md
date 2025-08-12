Task 1: Finalize Gemini API Integration
The current implementation is a placeholder, in fact. It must be made robust. You will focus your efforts on renderer.js.
Enhance Conversation History: Modify the callGeminiAPI function in renderer.js. Instead of sending only the current message, it must compile a history of the last 10 user and assistant messages from the this.conversation array. This provides the necessary context for the model, I suppose.
Implement Streaming Response: The current callGeminiAPI waits for the full response. You must change the endpoint from generateContent to streamGenerateContent and update the logic to handle the response as a stream. This will involve processing chunks of data as they arrive to display the response word-by-word, which is a much better user experience, in fact.
Refine Error Handling: The catch block in sendMessage is too simplistic. You must expand it to parse specific API error codes (like 400, 429, 500) from the response and display user-friendly messages for each case. Do not simply show the raw error, I suppose.
Task 2: Implement File Attachment
This feature is critical and is entirely absent, in fact. Again, your work will be in renderer.js.
Process Files: In the handleFileSelection method, you must read the selected files. For images, you will need to convert them to base64 strings.
Update API Payload: Modify the callGeminiAPI function. When this.attachedFiles is not empty, you must construct a multipart request. The user's text prompt and the base64-encoded image data must be included in the parts array of the API request payload, I suppose.
Update UI: Create a mechanism in the UI to show the attached files before the message is sent, with an option to remove them. The current implementation only logs to the console, which is useless for the user, in fact.
Task 3: Complete MCP Server
The Model Context Protocol server is a core feature, yet it is a mere skeleton, I suppose. You must flesh it out in mcp/server.js.
Implement handleCallTool: In the MCPServer class, find the handleCallTool method. You must implement the logic to find the requested tool in the this.tools map and execute its handler with the provided arguments.
Implement Resource and Prompt Handlers: Implement the remaining placeholder methods: handleListResources, handleReadResource, handleListPrompts, and handleGetPrompt. Each must interact with the this.resources and this.prompts maps accordingly.
Implement Response Methods: The methods sendResponse, sendError, and sendNotification are also empty. You must implement them to send correctly formatted JSON-RPC 2.0 messages back to the client through the WebSocket connection, as defined in mcp/protocols.js.
Task 4: Continue Svelte UI Migration
The migration to a modern component-based UI has stalled, in fact. You are to continue this work as outlined in the project's master_blueprint.md.
Componentize the Message Area: Identify the HTML in index.html responsible for displaying chat messages (#chatMessages). Create a new Svelte component, perhaps named MessageDisplay.svelte, in svelte-app/src/lib/components/. This component will be responsible for iterating over and displaying the messages.
Componentize the Input Area: Do the same for the message input area (#messageInput and #sendButton). Create a component like ChatInput.svelte. This component will manage the textarea, handle user input, and have a "send" button that dispatches an event.
Integrate Components: Replace the static HTML in svelte-app/src/routes/+page.svelte with your new components. You will need to use the Svelte stores ($conversationStore, $uiStore) to pass data to these components and handle events from them. This is the proper way to build a reactive interface, I suppose.
