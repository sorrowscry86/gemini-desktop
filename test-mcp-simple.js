#!/usr/bin/env node

// Simple test script to investigate MCP functionality
const MCPServer = require('./mcp/server');
const MCPClient = require('./src/mcp-client');
const { spawn } = require('child_process');

async function testMCPServer() {
    console.log('🔍 Testing MCP Server functionality...\n');
    
    try {
        console.log('1. Creating MCP Server instance...');
        const server = new MCPServer({
            name: 'Test MCP Server',
            host: 'localhost',
            port: 8081
        });
        
        console.log('   ✅ MCP Server instance created successfully');
        
        console.log('2. Starting MCP Server...');
        await server.start();
        console.log('   ✅ MCP Server started successfully on port 8081');
        
        console.log('3. Stopping MCP Server...');
        await server.stop();
        console.log('   ✅ MCP Server stopped successfully');
        
    } catch (error) {
        console.error('   ❌ MCP Server test failed:', error.message);
        console.error('   Stack:', error.stack);
        return false;
    }
    
    return true;
}

async function testMCPClient() {
    console.log('\n🔍 Testing MCP Client functionality...\n');
    
    try {
        console.log('1. Creating MCP Client instance...');
        const client = new MCPClient({
            debug: true,
            connectionTimeout: 5000,
            requestTimeout: 10000
        });
        
        console.log('   ✅ MCP Client instance created successfully');
        
        console.log('2. Testing client diagnostics...');
        const diagnostics = client.getAllConnectionDiagnostics();
        console.log('   ✅ Client diagnostics:', diagnostics);
        
    } catch (error) {
        console.error('   ❌ MCP Client test failed:', error.message);
        console.error('   Stack:', error.stack);
        return false;
    }
    
    return true;
}

async function testGrimoireSummoner() {
    console.log('\n🔍 Testing Grimoire Summoner functionality...\n');
    
    try {
        console.log('1. Creating Grimoire Summoner instance...');
        const GrimoireSummoner = require('./src/grimoire-summoner');
        const summoner = new GrimoireSummoner({
            debug: true,
            grimoireDir: '/tmp/test-grimoires'
        });
        
        console.log('   ✅ Grimoire Summoner instance created successfully');
        
        console.log('2. Checking active grimoires...');
        const activeGrimoires = summoner.listActiveGrimoires();
        console.log('   ✅ Active grimoires:', activeGrimoires);
        
    } catch (error) {
        console.error('   ❌ Grimoire Summoner test failed:', error.message);
        console.error('   Stack:', error.stack);
        return false;
    }
    
    return true;
}

async function testChatWindowResponsiveness() {
    console.log('\n🔍 Analyzing Chat Window Responsiveness Issues...\n');
    
    const issues = [];
    
    // Check 1: Electron dependencies
    try {
        require('electron');
        console.log('   ✅ Electron module available');
    } catch (error) {
        console.error('   ❌ Electron module issue:', error.message);
        issues.push('Electron dependency issue');
    }
    
    // Check 2: File system access
    const fs = require('fs');
    try {
        fs.accessSync('./', fs.constants.R_OK | fs.constants.W_OK);
        console.log('   ✅ File system access OK');
    } catch (error) {
        console.error('   ❌ File system access issue:', error.message);
        issues.push('File system access denied');
    }
    
    // Check 3: WebSocket functionality
    try {
        const WebSocket = require('ws');
        console.log('   ✅ WebSocket module available');
    } catch (error) {
        console.error('   ❌ WebSocket module issue:', error.message);
        issues.push('WebSocket dependency issue');
    }
    
    // Check 4: Google AI dependencies
    try {
        const { GoogleGenAI } = require('@google/genai');
        console.log('   ✅ Google AI SDK available');
    } catch (error) {
        console.error('   ❌ Google AI SDK issue:', error.message);
        issues.push('Google AI SDK dependency issue');
    }
    
    return issues;
}

async function main() {
    console.log('🧪 MCP and Chat Responsiveness Investigation\n');
    console.log('=' .repeat(60));
    
    const results = {
        mcpServer: await testMCPServer(),
        mcpClient: await testMCPClient(), 
        grimoireSummoner: await testGrimoireSummoner(),
        chatIssues: await testChatWindowResponsiveness()
    };
    
    console.log('\n' + '=' .repeat(60));
    console.log('📋 INVESTIGATION SUMMARY');
    console.log('=' .repeat(60));
    
    console.log(`MCP Server:        ${results.mcpServer ? '✅ Working' : '❌ Issues detected'}`);
    console.log(`MCP Client:        ${results.mcpClient ? '✅ Working' : '❌ Issues detected'}`);
    console.log(`Grimoire Summoner: ${results.grimoireSummoner ? '✅ Working' : '❌ Issues detected'}`);
    console.log(`Chat Dependencies: ${results.chatIssues.length === 0 ? '✅ All OK' : '❌ ' + results.chatIssues.length + ' issues'}`);
    
    if (results.chatIssues.length > 0) {
        console.log('\nChat Window Issues:');
        results.chatIssues.forEach((issue, index) => {
            console.log(`  ${index + 1}. ${issue}`);
        });
    }
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('- Install Playwright browsers: npx playwright install');
    console.log('- Run app with --no-sandbox flag in headless environments');
    console.log('- Ensure all dependencies are properly installed');
    console.log('- Test MCP connections with real servers\n');
}

main().catch(console.error);