/**
 * Test for context persistence
 * This test validates that browser and tab context information is correctly
 * returned and persisted across multiple tool calls
 */

import { execSync } from 'child_process';

// Import the MCP client
const mcpClient = {
  request: async (method, params = {}) => {
    try {
      // Set proper method path - tools.call is the correct MCP format
      const mcpMethod = method.startsWith('chrome_') ? 'tools.call' : method;
      const mcpRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: mcpMethod,
        params: method.startsWith('chrome_') ? {
          name: method,
          arguments: params
        } : params
      };

      console.log(`\n\n🔄 REQUEST: ${method}`, JSON.stringify(params, null, 2));
      console.log(`MCP Request: ${JSON.stringify(mcpRequest, null, 2)}`);
      
      // Execute the command through the stdio adapter with better error handling
      const command = `echo '${JSON.stringify(mcpRequest)}' | node ./bin/index.js`;
      
      const response = execSync(command, { 
        encoding: 'utf8', 
        maxBuffer: 10 * 1024 * 1024,
        stdio: ['pipe', 'pipe', 'ignore'] // Ignore stderr to avoid mixing with stdout
      });
      
      try {
        // Extract just the JSON response by finding the first '{' and last '}'
        const jsonStartIndex = response.indexOf('{');
        const jsonEndIndex = response.lastIndexOf('}') + 1;
        
        if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
          const jsonResponse = response.substring(jsonStartIndex, jsonEndIndex);
          const parsedResponse = JSON.parse(jsonResponse);
          console.log(`✅ RESPONSE: ${method}`, JSON.stringify(parsedResponse.result || parsedResponse.error, null, 2));
          
          if (parsedResponse.error) {
            console.error('❌ ERROR:', parsedResponse.error);
            throw new Error(parsedResponse.error.message);
          }
          
          return parsedResponse.result;
        } else {
          console.error('❌ No valid JSON found in response');
          throw new Error('No valid JSON found in response');
        }
      } catch (err) {
        if (err instanceof SyntaxError) {
          console.error('❌ Failed to parse response - invalid JSON');
          console.log('Raw response (first 500 chars):', response.substring(0, 500));
          if (response.length > 500) console.log('... (response truncated)');
        } else {
          console.error('❌ Error processing response:', err);
        }
        throw err;
      }
    } catch (error) {
      console.error(`❌ Failed to execute ${method}:`, error.message);
      throw error;
    }
  }
};

/**
 * Run a sequence of browser actions and validate context persistence
 */
async function runTest() {
  console.log('🧪 Starting context persistence test');
  
  try {
    // Step 1: Launch browser
    console.log('\n🔍 Step 1: Launch browser');
    const browserResult = await mcpClient.request('chrome_create_browser');
    
    // Validate browser context
    if (!browserResult.context || !browserResult.context.browserId) {
      throw new Error('Browser context missing or invalid');
    }
    console.log('✅ Browser context validated:', browserResult.context.browserId);
    
    const browserId = browserResult.context.browserId;
    
    // Step 2: Create a new tab
    console.log('\n🔍 Step 2: Create a new tab');
    const tabResult = await mcpClient.request('chrome_create_tab', { browserId });
    
    // Validate tab context
    if (!tabResult.context || !tabResult.context.tabId) {
      throw new Error('Tab context missing or invalid');
    }
    console.log('✅ Tab context validated:', tabResult.context.tabId);
    
    const tabId = tabResult.context.tabId;
    
    // Step 3: Navigate to a URL
    console.log('\n🔍 Step 3: Navigate to a URL');
    const navigateResult = await mcpClient.request('chrome_navigate', {
      browserId,
      tabId,
      url: 'https://example.com'
    });
    
    // Validate context persistence after navigation
    if (navigateResult.context.browserId !== browserId) {
      throw new Error('Browser ID changed after navigation');
    }
    
    if (navigateResult.context.tabId !== tabId) {
      throw new Error('Tab ID changed after navigation');
    }
    
    console.log('✅ Context persistence validated after navigation');
    
    // Step 4: Test context in screenshot
    console.log('\n🔍 Step 4: Take a screenshot');
    const screenshotResult = await mcpClient.request('chrome_screenshot', {
      browserId,
      tabId,
      name: 'test-screenshot'
    });
    
    // Validate context persistence after screenshot
    if (screenshotResult.context.browserId !== browserId) {
      throw new Error('Browser ID changed after screenshot');
    }
    
    if (screenshotResult.context.tabId !== tabId) {
      throw new Error('Tab ID changed after screenshot');
    }
    
    console.log('✅ Context persistence validated after screenshot');
    
    // Step 5: Test action chaining with context persistence
    console.log('\n🔍 Step 5: Test action chaining');
    const chainResult = await mcpClient.request('chrome_chain', {
      browserId,
      tabId,
      actions: [
        {
          type: 'navigate',
          params: {
            url: 'https://example.org'
          }
        },
        {
          type: 'wait',
          params: {
            time: 1000
          }
        },
        {
          type: 'screenshot',
          params: {
            name: 'chain-screenshot'
          }
        }
      ]
    });
    
    // Validate context persistence after chain
    if (!chainResult.context || !chainResult.context.browserId) {
      throw new Error('Browser context missing or invalid after chain');
    }
    
    if (!chainResult.context.tabId) {
      throw new Error('Tab context missing or invalid after chain');
    }
    
    console.log('✅ Context persistence validated after action chain');
    
    // Step 6: Close tab and check for context
    console.log('\n🔍 Step 6: Close tab and validate context');
    const closeTabResult = await mcpClient.request('chrome_close_tab', {
      browserId,
      tabId
    });
    
    // Validate that context is still provided even after closing the tab
    if (!closeTabResult.context || !closeTabResult.context.browserId) {
      throw new Error('Browser context missing after closing tab');
    }
    
    console.log('✅ Context provided after tab closure');
    
    // Step 7: Close browser and check for context
    console.log('\n🔍 Step 7: Close browser and validate context');
    const closeBrowserResult = await mcpClient.request('chrome_close_browser', {
      browserId
    });
    
    // Validate that context is still provided even after closing the browser
    if (!closeBrowserResult.context || !closeBrowserResult.context.browserId) {
      throw new Error('Context missing after closing browser');
    }
    
    console.log('✅ Context provided after browser closure');
    
    console.log('\n✅ All context persistence tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
runTest();