/**
 * Form Interaction Test for Chrome Control
 * Tests input filling, selecting options, clicking buttons, and keyboard input
 */

import puppeteer from 'puppeteer';
import http from 'http';

// Create a simple HTTP server for testing
function createTestServer(port = 3000) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.url === '/form-submit' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Form Submission Result</title>
              </head>
              <body>
                <h1>Form Submitted</h1>
                <div id="result">
                  ${body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                </div>
                <a href="/">Back to Form</a>
              </body>
            </html>
          `);
        });
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Form Interaction Test</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .form-group { margin-bottom: 15px; }
              label { display: block; margin-bottom: 5px; }
              input, select, textarea { width: 300px; padding: 8px; }
              button { padding: 10px 15px; background: #4CAF50; color: white; border: none; cursor: pointer; }
              #result { margin-top: 20px; padding: 10px; background: #f0f0f0; }
              #keyboardOutput { min-height: 50px; border: 1px solid #ccc; padding: 10px; margin-top: 10px; }
            </style>
          </head>
          <body>
            <h1>Form Interaction Test</h1>
            
            <form id="testForm" action="/form-submit" method="post">
              <div class="form-group">
                <label for="name">Name:</label>
                <input type="text" id="name" name="name" placeholder="Enter your name">
              </div>
              
              <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" placeholder="Enter your email">
              </div>
              
              <div class="form-group">
                <label for="country">Country:</label>
                <select id="country" name="country">
                  <option value="">Select a country</option>
                  <option value="us">United States</option>
                  <option value="ca">Canada</option>
                  <option value="uk">United Kingdom</option>
                  <option value="au">Australia</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="message">Message:</label>
                <textarea id="message" name="message" rows="4" placeholder="Enter your message"></textarea>
              </div>
              
              <div class="form-group">
                <input type="checkbox" id="subscribe" name="subscribe" value="yes">
                <label for="subscribe" style="display: inline;">Subscribe to newsletter</label>
              </div>
              
              <button type="submit" id="submitButton">Submit Form</button>
            </form>
            
            <div class="form-group">
              <h2>Keyboard Test</h2>
              <p>Type something in the box below:</p>
              <input type="text" id="keyboardTest" placeholder="Click here and type">
              <div id="keyboardOutput"></div>
            </div>
            
            <script>
              // Display keyboard events
              const keyboardTest = document.getElementById('keyboardTest');
              const keyboardOutput = document.getElementById('keyboardOutput');
              
              keyboardTest.addEventListener('keydown', (e) => {
                const keyInfo = document.createElement('div');
                keyInfo.textContent = 'Key pressed: ' + e.key;
                keyboardOutput.appendChild(keyInfo);
              });
              
              // Form submission handling
              document.getElementById('testForm').addEventListener('submit', function(e) {
                // Allow the form to submit normally for the test
              });
            </script>
          </body>
        </html>
      `);
    });
    
    server.listen(port, () => {
      console.log(`Test server running at http://localhost:${port}`);
      resolve({
        url: `http://localhost:${port}`,
        close: () => {
          server.close();
          console.log('Test server closed');
        }
      });
    });
  });
}

// Set up tests
async function runTests() {
  let browser;
  let page;
  let server;
  
  try {
    console.log('Starting form interaction tests...');
    
    // Start test server
    server = await createTestServer(3002);
    console.log('✅ Test server started');
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('✅ Browser launched');
    
    // Create page
    page = await browser.newPage();
    console.log('✅ Page created');
    
    // Navigate to test page
    await page.goto(server.url);
    console.log('✅ Navigation successful');
    
    // Test 1: Fill text inputs
    await page.type('#name', 'Test User');
    await page.type('#email', 'test@example.com');
    const nameValue = await page.$eval('#name', el => el.value);
    console.assert(nameValue === 'Test User', 'Name field should be filled correctly');
    console.log('✅ Text input filling successful');
    
    // Test 2: Select dropdown option
    await page.select('#country', 'uk');
    const countryValue = await page.$eval('#country', el => el.value);
    console.assert(countryValue === 'uk', 'Country should be selected correctly');
    console.log('✅ Dropdown selection successful');
    
    // Test 3: Fill textarea
    await page.type('#message', 'This is a test message');
    const messageValue = await page.$eval('#message', el => el.value);
    console.assert(messageValue === 'This is a test message', 'Message should be filled correctly');
    console.log('✅ Textarea filling successful');
    
    // Test 4: Check checkbox
    await page.click('#subscribe');
    const isChecked = await page.$eval('#subscribe', el => el.checked);
    console.assert(isChecked === true, 'Checkbox should be checked');
    console.log('✅ Checkbox checking successful');
    
    // Test 5: Keyboard input test
    await page.click('#keyboardTest');
    
    // Type character by character since some older Puppeteer versions might not support type well
    const testText = 'Hello World';
    for (const char of testText) {
      await page.keyboard.press(char);
      // Add a small delay to ensure stability
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const keyboardValue = await page.$eval('#keyboardTest', el => el.value);
    console.assert(keyboardValue === 'Hello World', 'Keyboard input should work correctly');
    console.log('✅ Keyboard input successful');
    
    // Test 6: Press special keys
    await page.click('#keyboardTest');
    await page.keyboard.press('End'); // Move to end of input
    await page.keyboard.press('Backspace');
    const afterBackspace = await page.$eval('#keyboardTest', el => el.value);
    console.assert(afterBackspace === 'Hello Worl', 'Backspace should remove last character');
    console.log('✅ Special key press successful');
    
    // Test 7: Form submission
    await Promise.all([
      page.waitForNavigation(),
      page.click('#submitButton')
    ]);
    
    const resultPageTitle = await page.title();
    console.assert(resultPageTitle === 'Form Submission Result', 'Should navigate to result page');
    console.log('✅ Form submission successful');
    
    // All tests passed
    console.log('\nAll form interaction tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  } finally {
    // Clean up
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
    if (server) {
      server.close();
    }
  }
}

// Run the test
console.log('Running form interaction tests...');
runTests()
  .then(success => {
    if (success) {
      console.log('All form interaction tests passed!');
      process.exit(0);
    } else {
      console.error('Some form interaction tests failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });