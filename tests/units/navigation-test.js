/**
 * Navigation test for Chrome Control
 * Tests navigation, waiting, and page content extraction
 */

import puppeteer from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';
import http from 'http';

// Create a simple HTTP server for testing
function createTestServer(port = 3000) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.url === '/page2') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Test Page 2</title>
            </head>
            <body>
              <h1>Test Page 2</h1>
              <p>This is the second test page.</p>
              <a href="/">Back to Home</a>
            </body>
          </html>
        `);
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Test Navigation Page</title>
          </head>
          <body>
            <h1>Test Navigation Page</h1>
            <p id="content">This content is for testing navigation.</p>
            <div id="dynamic" style="display: none;">This content appears after 1 second</div>
            <button id="showButton">Show Dynamic Content</button>
            <a href="/page2">Go to Page 2</a>
            <form>
              <input type="text" id="testInput" placeholder="Test Input">
              <select id="testSelect">
                <option value="option1">Option 1</option>
                <option value="option2">Option 2</option>
              </select>
              <button type="button" id="testButton">Test Button</button>
            </form>
            <script>
              document.getElementById('showButton').addEventListener('click', () => {
                setTimeout(() => {
                  document.getElementById('dynamic').style.display = 'block';
                }, 1000);
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
    console.log('Starting navigation tests...');
    
    // Start test server
    server = await createTestServer(3001);
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
    
    // Test 1: Navigate to test server
    await page.goto(server.url);
    const title = await page.title();
    console.assert(title === 'Test Navigation Page', 'Page title should match');
    console.log('✅ Navigation successful');
    
    // Test 2: Wait for selector
    await page.waitForSelector('#testButton');
    console.log('✅ Wait for selector successful');
    
    // Test 3: Page content extraction
    const content = await page.evaluate(() => document.getElementById('content').textContent);
    console.assert(content === 'This content is for testing navigation.', 'Content text should match');
    console.log('✅ Content extraction successful');
    
    // Test 4: Link extraction
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a')).map(a => ({
        text: a.innerText,
        href: a.href
      }));
    });
    console.assert(links.length > 0, 'Page should have links');
    console.assert(links.some(link => link.href.includes('/page2')), 'Page should have link to page2');
    console.log('✅ Link extraction successful');
    
    // Test 5: Click and navigation
    await Promise.all([
      page.waitForNavigation(),
      page.click('a[href="/page2"]')
    ]);
    const page2Title = await page.title();
    console.assert(page2Title === 'Test Page 2', 'Page 2 title should match');
    console.log('✅ Click and navigation successful');
    
    // Test 6: Navigate back
    await Promise.all([
      page.waitForNavigation(),
      page.click('a[href="/"]')
    ]);
    const homeTitle = await page.title();
    console.assert(homeTitle === 'Test Navigation Page', 'Home title should match');
    console.log('✅ Navigation back successful');
    
    // Test 7: Wait for dynamic content
    await page.click('#showButton');
    await page.waitForFunction(() => 
      window.getComputedStyle(document.getElementById('dynamic')).display === 'block', 
      { timeout: 2000 }
    );
    console.log('✅ Wait for dynamic content successful');
    
    // Test 8: Wait for a specified time using setTimeout
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 500));
    const elapsedTime = Date.now() - startTime;
    console.assert(elapsedTime >= 500, 'Timeout should be at least 500ms');
    console.log('✅ Wait for timeout successful');
    
    // All tests passed
    console.log('\nAll navigation tests passed!');
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
console.log('Running navigation tests...');
runTests()
  .then(success => {
    if (success) {
      console.log('All navigation tests passed!');
      process.exit(0);
    } else {
      console.error('Some navigation tests failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });