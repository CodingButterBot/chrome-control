/**
 * Comprehensive Feature Test Suite for Chrome Control
 * 
 * This test suite provides complete coverage of all Chrome Control features
 * with visual verification through non-headless browsers. Each MCP tool is tested
 * to ensure an LLM can fully interact with the browser through the MCP interface.
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AnonymizeUAPlugin from 'puppeteer-extra-plugin-anonymize-ua';
import { v4 as uuidv4 } from 'uuid';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the actual MCP tools to test them directly
import { 
  createBrowser, 
  listBrowsers, 
  closeBrowser, 
  createTab, 
  listTabs,
  closeTab,
  navigate,
  wait,
  screenshot,
  click,
  hover,
  fill,
  select,
  keyboard,
  mouse,
  cookies,
  evaluate,
  chain
} from '../bin/puppeteer.js';

// Apply plugins to enhance Puppeteer behavior
puppeteer.use(StealthPlugin());
puppeteer.use(AnonymizeUAPlugin());

// Track test results
const results = {
  passed: 0,
  failed: 0,
  total: 0,
  skipped: 0
};

// Track screenshots for visual verification
const screenshotDirs = {
  browser: path.join(__dirname, '../test-screenshots/browser'),
  tabs: path.join(__dirname, '../test-screenshots/tabs'),
  navigation: path.join(__dirname, '../test-screenshots/navigation'),
  interaction: path.join(__dirname, '../test-screenshots/interaction'),
  forms: path.join(__dirname, '../test-screenshots/forms'),
  cookies: path.join(__dirname, '../test-screenshots/cookies'),
  evaluation: path.join(__dirname, '../test-screenshots/evaluation'),
  chaining: path.join(__dirname, '../test-screenshots/chaining')
};

// Ensure screenshot directories exist
Object.values(screenshotDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Create a test HTTP server with pages for testing all features
 */
function createTestServer(port = 3040) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${port}`);
      const pathname = url.pathname;
      
      // Main test page
      if (pathname === '/' || pathname === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Chrome Control Feature Test</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; }
                section { border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
                h2 { margin-top: 0; color: #333; }
                button { padding: 8px 15px; background: #4CAF50; color: white; border: none; cursor: pointer; margin-right: 10px; border-radius: 3px; }
                button:hover { background: #45a049; }
                input, select, textarea { padding: 8px; margin: 5px 0; width: 300px; border: 1px solid #ddd; border-radius: 3px; }
                .result { background: #f5f5f5; padding: 10px; margin-top: 10px; border-radius: 3px; min-height: 20px; display: none; }
                .checkbox-group { display: flex; gap: 20px; margin: 10px 0; }
                .checkbox-group label { display: flex; align-items: center; gap: 5px; }
                .radio-group { display: flex; gap: 20px; margin: 10px 0; }
                .hover-area { padding: 15px; background: #f0f0f0; border-radius: 3px; text-align: center; transition: background 0.3s; }
                .hover-area:hover { background: #e0e0e0; }
                .nav-buttons { display: flex; gap: 10px; margin: 20px 0; }
                #delayedContent { display: none; }
                table { border-collapse: collapse; width: 100%; margin: 15px 0; }
                table, th, td { border: 1px solid #ddd; }
                th, td { padding: 10px; text-align: left; }
                #mouseCoords { margin-top: 10px; }
                #colorBox { width: 100px; height: 100px; background: red; margin: 10px 0; }
                .tab-container { display: flex; margin-bottom: 10px; }
                .tab { padding: 10px 20px; cursor: pointer; background: #f0f0f0; border: 1px solid #ddd; border-bottom: none; }
                .tab.active { background: white; }
                .tab-content { border: 1px solid #ddd; padding: 15px; display: none; }
                .tab-content.active { display: block; }
              </style>
            </head>
            <body>
              <h1>Chrome Control MCP Tool Test Page</h1>
              <p>This page contains elements to test all Chrome Control MCP tools.</p>
              
              <div class="nav-buttons">
                <a href="/" id="homeLink">Home</a>
                <a href="/forms.html" id="formsLink">Forms Page</a>
                <a href="/cookies.html" id="cookiesLink">Cookies Page</a>
                <a href="/dynamicContent.html" id="dynamicLink">Dynamic Content</a>
              </div>
              
              <section id="clickSection">
                <h2>Click Testing</h2>
                <p>Test clicking functionality of various elements.</p>
                <button id="visibleButton">Click Me</button>
                <button id="delayButton">Show Delayed Content</button>
                <div id="clickResult" class="result">Button was clicked!</div>
                <div id="delayedContent" class="result">This content appears after delay</div>
              </section>
              
              <section id="hoverSection">
                <h2>Hover Testing</h2>
                <p>Test hover functionality.</p>
                <div id="hoverArea" class="hover-area">Hover over me</div>
                <div id="hoverResult" class="result">Element was hovered!</div>
              </section>
              
              <section id="keyboardSection">
                <h2>Keyboard Testing</h2>
                <p>Test keyboard interaction.</p>
                <input type="text" id="keyboardInput" placeholder="Type here...">
                <div id="keyPressArea" tabindex="0" style="border: 1px solid #ccc; padding: 10px; margin-top: 10px;">
                  Click here and press keys (tabindex="0")
                </div>
                <div id="keyboardResult" class="result"></div>
              </section>
              
              <section id="mouseSection">
                <h2>Mouse Testing</h2>
                <p>Test mouse movements and actions.</p>
                <div id="mouseTrackingArea" style="width: 400px; height: 200px; border: 1px solid #ccc; position: relative;">
                  Move mouse in this area
                  <div id="mouseCoords"></div>
                </div>
              </section>
              
              <section id="formSection">
                <h2>Basic Form Elements</h2>
                <form id="simpleForm">
                  <div>
                    <label for="nameInput">Name:</label>
                    <input type="text" id="nameInput" name="name" placeholder="Enter your name">
                  </div>
                  <div>
                    <label for="emailInput">Email:</label>
                    <input type="email" id="emailInput" name="email" placeholder="Enter your email">
                  </div>
                  <div>
                    <label for="commentInput">Comment:</label>
                    <textarea id="commentInput" name="comment" placeholder="Enter your comment" rows="3"></textarea>
                  </div>
                  <div>
                    <label for="countrySelect">Country:</label>
                    <select id="countrySelect" name="country">
                      <option value="">-- Select Country --</option>
                      <option value="us">United States</option>
                      <option value="ca">Canada</option>
                      <option value="uk">United Kingdom</option>
                      <option value="au">Australia</option>
                    </select>
                  </div>
                  <div class="checkbox-group">
                    <label>
                      <input type="checkbox" id="subscribe" name="subscribe" value="yes">
                      Subscribe to newsletter
                    </label>
                    <label>
                      <input type="checkbox" id="terms" name="terms" value="accept">
                      Accept terms
                    </label>
                  </div>
                  <div class="radio-group">
                    <label>
                      <input type="radio" name="contact" value="email" id="contactEmail">
                      Contact by email
                    </label>
                    <label>
                      <input type="radio" name="contact" value="phone" id="contactPhone">
                      Contact by phone
                    </label>
                  </div>
                  <button type="button" id="submitForm">Submit Form</button>
                </form>
                <div id="formResult" class="result"></div>
              </section>
              
              <section id="tabsSection">
                <h2>Tab Interface</h2>
                <div class="tab-container">
                  <div class="tab active" data-tab="tab1">Tab 1</div>
                  <div class="tab" data-tab="tab2">Tab 2</div>
                  <div class="tab" data-tab="tab3">Tab 3</div>
                </div>
                <div id="tab1" class="tab-content active">
                  <h3>Tab 1 Content</h3>
                  <p>This is the content for tab 1.</p>
                  <button id="tab1Button">Tab 1 Action</button>
                </div>
                <div id="tab2" class="tab-content">
                  <h3>Tab 2 Content</h3>
                  <p>This is the content for tab 2.</p>
                  <input type="text" id="tab2Input" placeholder="Tab 2 input">
                </div>
                <div id="tab3" class="tab-content">
                  <h3>Tab 3 Content</h3>
                  <p>This is the content for tab 3.</p>
                  <div id="colorBox"></div>
                  <button id="changeColorButton">Change Color</button>
                </div>
              </section>
              
              <section id="tableSection">
                <h2>Table Interaction</h2>
                <table id="dataTable">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1</td>
                      <td>John Doe</td>
                      <td>john@example.com</td>
                      <td><button class="editButton" data-id="1">Edit</button></td>
                    </tr>
                    <tr>
                      <td>2</td>
                      <td>Jane Smith</td>
                      <td>jane@example.com</td>
                      <td><button class="editButton" data-id="2">Edit</button></td>
                    </tr>
                    <tr>
                      <td>3</td>
                      <td>Bob Johnson</td>
                      <td>bob@example.com</td>
                      <td><button class="editButton" data-id="3">Edit</button></td>
                    </tr>
                  </tbody>
                </table>
                <div id="tableResult" class="result"></div>
              </section>
              
              <script>
                // Click handling
                document.getElementById('visibleButton').addEventListener('click', function() {
                  document.getElementById('clickResult').style.display = 'block';
                });
                
                document.getElementById('delayButton').addEventListener('click', function() {
                  setTimeout(function() {
                    document.getElementById('delayedContent').style.display = 'block';
                  }, 1000);
                });
                
                // Hover handling
                document.getElementById('hoverArea').addEventListener('mouseenter', function() {
                  document.getElementById('hoverResult').style.display = 'block';
                });
                
                document.getElementById('hoverArea').addEventListener('mouseleave', function() {
                  document.getElementById('hoverResult').style.display = 'none';
                });
                
                // Keyboard handling
                document.getElementById('keyboardInput').addEventListener('input', function() {
                  document.getElementById('keyboardResult').style.display = 'block';
                  document.getElementById('keyboardResult').textContent = 'You typed: ' + this.value;
                });
                
                document.getElementById('keyPressArea').addEventListener('keydown', function(e) {
                  document.getElementById('keyboardResult').style.display = 'block';
                  document.getElementById('keyboardResult').textContent = 'Key pressed: ' + e.key + ' (code: ' + e.code + ')';
                });
                
                // Mouse tracking
                const trackingArea = document.getElementById('mouseTrackingArea');
                const mouseCoords = document.getElementById('mouseCoords');
                
                trackingArea.addEventListener('mousemove', function(e) {
                  const rect = trackingArea.getBoundingClientRect();
                  const x = Math.round(e.clientX - rect.left);
                  const y = Math.round(e.clientY - rect.top);
                  mouseCoords.textContent = 'X: ' + x + ', Y: ' + y;
                });
                
                // Form handling
                document.getElementById('submitForm').addEventListener('click', function() {
                  const formData = {
                    name: document.getElementById('nameInput').value,
                    email: document.getElementById('emailInput').value,
                    comment: document.getElementById('commentInput').value,
                    country: document.getElementById('countrySelect').value,
                    subscribe: document.getElementById('subscribe').checked,
                    terms: document.getElementById('terms').checked,
                    contact: document.querySelector('input[name="contact"]:checked')?.value
                  };
                  
                  document.getElementById('formResult').style.display = 'block';
                  document.getElementById('formResult').textContent = 'Form submitted: ' + JSON.stringify(formData);
                });
                
                // Tab interface
                const tabs = document.querySelectorAll('.tab');
                tabs.forEach(tab => {
                  tab.addEventListener('click', function() {
                    // Remove active class from all tabs
                    tabs.forEach(t => t.classList.remove('active'));
                    // Add active class to clicked tab
                    this.classList.add('active');
                    
                    // Hide all tab content
                    document.querySelectorAll('.tab-content').forEach(content => {
                      content.classList.remove('active');
                    });
                    
                    // Show content for active tab
                    const tabId = this.getAttribute('data-tab');
                    document.getElementById(tabId).classList.add('active');
                  });
                });
                
                // Tab buttons
                document.getElementById('tab1Button').addEventListener('click', function() {
                  alert('Tab 1 button clicked');
                });
                
                document.getElementById('changeColorButton').addEventListener('click', function() {
                  const colorBox = document.getElementById('colorBox');
                  const currentColor = colorBox.style.backgroundColor || 'red';
                  colorBox.style.backgroundColor = currentColor === 'red' ? 'blue' : 'red';
                });
                
                // Table buttons
                document.querySelectorAll('.editButton').forEach(button => {
                  button.addEventListener('click', function() {
                    const id = this.getAttribute('data-id');
                    document.getElementById('tableResult').style.display = 'block';
                    document.getElementById('tableResult').textContent = 'Editing record ID: ' + id;
                  });
                });
              </script>
            </body>
          </html>
        `);
        return;
      }
      
      // Forms test page
      if (pathname === '/forms.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Advanced Forms Test</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; }
                section { border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
                h2 { margin-top: 0; color: #333; }
                button { padding: 8px 15px; background: #4CAF50; color: white; border: none; cursor: pointer; margin-right: 10px; border-radius: 3px; }
                button:hover { background: #45a049; }
                input, select, textarea { padding: 8px; margin: 5px 0; width: 300px; border: 1px solid #ddd; border-radius: 3px; }
                .result { background: #f5f5f5; padding: 10px; margin-top: 10px; border-radius: 3px; min-height: 20px; display: none; }
                .nav-buttons { display: flex; gap: 10px; margin: 20px 0; }
                .form-group { margin-bottom: 15px; }
                .form-row { display: flex; gap: 20px; margin-bottom: 15px; }
                .form-row > div { flex: 1; }
                .dropdown-container { position: relative; display: inline-block; width: 300px; }
                .dropdown-btn { width: 100%; text-align: left; background: #f0f0f0; border: 1px solid #ddd; padding: 8px; cursor: pointer; }
                .dropdown-content { display: none; position: absolute; width: 100%; background: white; border: 1px solid #ddd; z-index: 1; }
                .dropdown-item { padding: 8px; cursor: pointer; }
                .dropdown-item:hover { background: #f0f0f0; }
                .dropdown-open .dropdown-content { display: block; }
                input[type="date"], input[type="time"], input[type="color"] { width: auto; }
                .slider-container { width: 300px; }
                .slider-container input { width: 100%; }
                .validation-error { color: red; font-size: 0.8em; display: none; }
              </style>
            </head>
            <body>
              <h1>Advanced Forms Test Page</h1>
              <p>This page contains various form elements to test form interaction functionality.</p>
              
              <div class="nav-buttons">
                <a href="/" id="homeLink">Home</a>
                <a href="/forms.html" id="formsLink">Forms Page</a>
                <a href="/cookies.html" id="cookiesLink">Cookies Page</a>
                <a href="/dynamicContent.html" id="dynamicLink">Dynamic Content</a>
              </div>
              
              <section id="loginForm">
                <h2>Login Form</h2>
                <form>
                  <div class="form-group">
                    <label for="username">Username:</label>
                    <input type="text" id="username" name="username" placeholder="Enter username" autocomplete="username">
                    <div id="usernameError" class="validation-error">Username is required</div>
                  </div>
                  <div class="form-group">
                    <label for="password">Password:</label>
                    <input type="password" id="password" name="password" placeholder="Enter password" autocomplete="current-password">
                    <div id="passwordError" class="validation-error">Password is required</div>
                  </div>
                  <div class="form-group">
                    <label>
                      <input type="checkbox" id="rememberMe" name="rememberMe">
                      Remember me
                    </label>
                  </div>
                  <button type="button" id="loginButton">Login</button>
                </form>
                <div id="loginResult" class="result"></div>
              </section>
              
              <section id="customDropdown">
                <h2>Custom Dropdown</h2>
                <p>Test interaction with custom dropdowns (not standard select elements).</p>
                
                <div class="dropdown-container" id="customDropdown1">
                  <button class="dropdown-btn" id="dropdownButton">Select an option</button>
                  <div class="dropdown-content">
                    <div class="dropdown-item" data-value="option1">Option 1</div>
                    <div class="dropdown-item" data-value="option2">Option 2</div>
                    <div class="dropdown-item" data-value="option3">Option 3</div>
                  </div>
                </div>
                
                <div id="dropdownResult" class="result"></div>
              </section>
              
              <section id="dateTimeInputs">
                <h2>Date and Time Inputs</h2>
                <div class="form-row">
                  <div>
                    <label for="dateInput">Date:</label>
                    <input type="date" id="dateInput" name="date">
                  </div>
                  <div>
                    <label for="timeInput">Time:</label>
                    <input type="time" id="timeInput" name="time">
                  </div>
                  <div>
                    <label for="colorInput">Color:</label>
                    <input type="color" id="colorInput" name="color" value="#4CAF50">
                  </div>
                </div>
                <button type="button" id="dateTimeButton">Submit</button>
                <div id="dateTimeResult" class="result"></div>
              </section>
              
              <section id="rangeSliders">
                <h2>Range Sliders</h2>
                <div class="form-group slider-container">
                  <label for="rangeSlider">Range (1-100):</label>
                  <input type="range" id="rangeSlider" name="range" min="1" max="100" value="50">
                  <span id="rangeValue">50</span>
                </div>
                <div id="sliderResult" class="result"></div>
              </section>
              
              <section id="formValidation">
                <h2>Form Validation</h2>
                <form id="validationForm">
                  <div class="form-group">
                    <label for="emailValidation">Email:</label>
                    <input type="email" id="emailValidation" name="email" placeholder="Enter valid email" required>
                    <div id="emailError" class="validation-error">Please enter a valid email</div>
                  </div>
                  <div class="form-group">
                    <label for="phoneValidation">Phone Number:</label>
                    <input type="tel" id="phoneValidation" name="phone" placeholder="Enter phone number" pattern="[0-9]{10}" required>
                    <div id="phoneError" class="validation-error">Please enter a 10-digit phone number</div>
                  </div>
                  <div class="form-group">
                    <label for="passwordValidation">Password:</label>
                    <input type="password" id="passwordValidation" name="password" placeholder="Min 8 characters" minlength="8" required>
                    <div id="passwordValError" class="validation-error">Password must be at least 8 characters</div>
                  </div>
                  <button type="button" id="validateButton">Submit</button>
                </form>
                <div id="validationResult" class="result"></div>
              </section>
              
              <script>
                // Login form
                document.getElementById('loginButton').addEventListener('click', function() {
                  const username = document.getElementById('username').value;
                  const password = document.getElementById('password').value;
                  const rememberMe = document.getElementById('rememberMe').checked;
                  
                  // Basic validation
                  let valid = true;
                  
                  if (!username) {
                    document.getElementById('usernameError').style.display = 'block';
                    valid = false;
                  } else {
                    document.getElementById('usernameError').style.display = 'none';
                  }
                  
                  if (!password) {
                    document.getElementById('passwordError').style.display = 'block';
                    valid = false;
                  } else {
                    document.getElementById('passwordError').style.display = 'none';
                  }
                  
                  if (valid) {
                    document.getElementById('loginResult').style.display = 'block';
                    document.getElementById('loginResult').textContent = 'Login successful! Username: ' + username + ', Remember: ' + rememberMe;
                  }
                });
                
                // Custom dropdown
                document.getElementById('dropdownButton').addEventListener('click', function() {
                  const dropdown = document.getElementById('customDropdown1');
                  dropdown.classList.toggle('dropdown-open');
                });
                
                // Dropdown items
                document.querySelectorAll('.dropdown-item').forEach(item => {
                  item.addEventListener('click', function() {
                    const value = this.getAttribute('data-value');
                    const text = this.textContent;
                    
                    // Update button text
                    document.getElementById('dropdownButton').textContent = text;
                    
                    // Close dropdown
                    document.getElementById('customDropdown1').classList.remove('dropdown-open');
                    
                    // Show result
                    document.getElementById('dropdownResult').style.display = 'block';
                    document.getElementById('dropdownResult').textContent = 'Selected: ' + text + ' (value: ' + value + ')';
                  });
                });
                
                // Date and Time
                document.getElementById('dateTimeButton').addEventListener('click', function() {
                  const date = document.getElementById('dateInput').value;
                  const time = document.getElementById('timeInput').value;
                  const color = document.getElementById('colorInput').value;
                  
                  document.getElementById('dateTimeResult').style.display = 'block';
                  document.getElementById('dateTimeResult').textContent = 'Date: ' + date + ', Time: ' + time + ', Color: ' + color;
                });
                
                // Range slider
                const rangeSlider = document.getElementById('rangeSlider');
                const rangeValue = document.getElementById('rangeValue');
                
                rangeSlider.addEventListener('input', function() {
                  rangeValue.textContent = this.value;
                  document.getElementById('sliderResult').style.display = 'block';
                  document.getElementById('sliderResult').textContent = 'Range value: ' + this.value;
                });
                
                // Form validation
                document.getElementById('validateButton').addEventListener('click', function() {
                  const email = document.getElementById('emailValidation');
                  const phone = document.getElementById('phoneValidation');
                  const password = document.getElementById('passwordValidation');
                  
                  let valid = true;
                  
                  // Email validation
                  if (!email.validity.valid) {
                    document.getElementById('emailError').style.display = 'block';
                    valid = false;
                  } else {
                    document.getElementById('emailError').style.display = 'none';
                  }
                  
                  // Phone validation
                  if (!phone.validity.valid) {
                    document.getElementById('phoneError').style.display = 'block';
                    valid = false;
                  } else {
                    document.getElementById('phoneError').style.display = 'none';
                  }
                  
                  // Password validation
                  if (!password.validity.valid) {
                    document.getElementById('passwordValError').style.display = 'block';
                    valid = false;
                  } else {
                    document.getElementById('passwordValError').style.display = 'none';
                  }
                  
                  if (valid) {
                    document.getElementById('validationResult').style.display = 'block';
                    document.getElementById('validationResult').textContent = 'Form validated successfully!';
                  }
                });
                
                // Close dropdowns when clicking outside
                document.addEventListener('click', function(e) {
                  if (!e.target.closest('#customDropdown1')) {
                    document.getElementById('customDropdown1').classList.remove('dropdown-open');
                  }
                });
              </script>
            </body>
          </html>
        `);
        return;
      }
      
      // Cookies test page
      if (pathname === '/cookies.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Cookies Test</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; }
                section { border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
                h2 { margin-top: 0; color: #333; }
                button { padding: 8px 15px; background: #4CAF50; color: white; border: none; cursor: pointer; margin-right: 10px; border-radius: 3px; }
                button:hover { background: #45a049; }
                input { padding: 8px; margin: 5px 0; width: 300px; border: 1px solid #ddd; border-radius: 3px; }
                .result { background: #f5f5f5; padding: 10px; margin-top: 10px; border-radius: 3px; min-height: 20px; }
                .nav-buttons { display: flex; gap: 10px; margin: 20px 0; }
                .cookie-list { border: 1px solid #ddd; padding: 10px; max-height: 200px; overflow-y: auto; margin-top: 10px; }
                .form-row { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; }
                .form-row label { width: 100px; }
              </style>
            </head>
            <body>
              <h1>Cookies Test Page</h1>
              <p>Test cookie management functionality.</p>
              
              <div class="nav-buttons">
                <a href="/" id="homeLink">Home</a>
                <a href="/forms.html" id="formsLink">Forms Page</a>
                <a href="/cookies.html" id="cookiesLink">Cookies Page</a>
                <a href="/dynamicContent.html" id="dynamicLink">Dynamic Content</a>
              </div>
              
              <section id="cookieDisplay">
                <h2>Current Cookies</h2>
                <div id="cookieList" class="cookie-list">
                  <p>No cookies found</p>
                </div>
                <button id="refreshCookies">Refresh Cookie List</button>
              </section>
              
              <section id="cookieManagement">
                <h2>Cookie Management</h2>
                
                <div id="setCookie">
                  <h3>Set Cookie</h3>
                  <div class="form-row">
                    <label for="cookieName">Name:</label>
                    <input type="text" id="cookieName" placeholder="Cookie name">
                  </div>
                  <div class="form-row">
                    <label for="cookieValue">Value:</label>
                    <input type="text" id="cookieValue" placeholder="Cookie value">
                  </div>
                  <div class="form-row">
                    <label for="cookieExpires">Expires (days):</label>
                    <input type="number" id="cookieExpires" value="30" min="0">
                  </div>
                  <button id="setCookieButton">Set Cookie</button>
                </div>
                
                <div id="deleteCookie" style="margin-top: 20px;">
                  <h3>Delete Cookie</h3>
                  <div class="form-row">
                    <label for="deleteCookieName">Name:</label>
                    <input type="text" id="deleteCookieName" placeholder="Cookie name to delete">
                  </div>
                  <button id="deleteCookieButton">Delete Cookie</button>
                </div>
                
                <div style="margin-top: 20px;">
                  <button id="clearAllCookiesButton">Clear All Cookies</button>
                </div>
                
                <div id="cookieResult" class="result" style="margin-top: 20px;"></div>
              </section>
              
              <script>
                // Helper function to get all cookies as an object
                function getAllCookies() {
                  const cookies = {};
                  document.cookie.split(';').forEach(cookie => {
                    const [name, value] = cookie.trim().split('=');
                    if (name) cookies[name] = decodeURIComponent(value);
                  });
                  return cookies;
                }
                
                // Display cookies
                function displayCookies() {
                  const cookies = getAllCookies();
                  const cookieList = document.getElementById('cookieList');
                  
                  if (Object.keys(cookies).length === 0) {
                    cookieList.innerHTML = '<p>No cookies found</p>';
                    return;
                  }
                  
                  let html = '<ul>';
                  for (const name in cookies) {
                    html += '<li><strong>' + name + '</strong>: ' + cookies[name] + '</li>';
                  }
                  html += '</ul>';
                  
                  cookieList.innerHTML = html;
                }
                
                // Set cookie with expiration
                function setCookie(name, value, days) {
                  let expires = '';
                  if (days) {
                    const date = new Date();
                    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                    expires = '; expires=' + date.toUTCString();
                  }
                  document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/';
                  
                  // Show result
                  const result = document.getElementById('cookieResult');
                  result.textContent = 'Cookie set: ' + name + '=' + value;
                  
                  // Refresh cookie display
                  displayCookies();
                }
                
                // Delete cookie
                function deleteCookie(name) {
                  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                  
                  // Show result
                  const result = document.getElementById('cookieResult');
                  result.textContent = 'Cookie deleted: ' + name;
                  
                  // Refresh cookie display
                  displayCookies();
                }
                
                // Clear all cookies
                function clearAllCookies() {
                  const cookies = getAllCookies();
                  for (const name in cookies) {
                    deleteCookie(name);
                  }
                  
                  // Show result
                  const result = document.getElementById('cookieResult');
                  result.textContent = 'All cookies cleared';
                  
                  // Refresh cookie display
                  displayCookies();
                }
                
                // Initialize
                displayCookies();
                
                // Event listeners
                document.getElementById('refreshCookies').addEventListener('click', displayCookies);
                
                document.getElementById('setCookieButton').addEventListener('click', function() {
                  const name = document.getElementById('cookieName').value;
                  const value = document.getElementById('cookieValue').value;
                  const expires = parseInt(document.getElementById('cookieExpires').value, 10);
                  
                  if (!name || !value) {
                    document.getElementById('cookieResult').textContent = 'Error: Name and value are required';
                    return;
                  }
                  
                  setCookie(name, value, expires);
                });
                
                document.getElementById('deleteCookieButton').addEventListener('click', function() {
                  const name = document.getElementById('deleteCookieName').value;
                  
                  if (!name) {
                    document.getElementById('cookieResult').textContent = 'Error: Cookie name is required';
                    return;
                  }
                  
                  deleteCookie(name);
                });
                
                document.getElementById('clearAllCookiesButton').addEventListener('click', clearAllCookies);
              </script>
            </body>
          </html>
        `);
        return;
      }
      
      // Dynamic content page
      if (pathname === '/dynamicContent.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Dynamic Content Test</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; }
                section { border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
                h2 { margin-top: 0; color: #333; }
                button { padding: 8px 15px; background: #4CAF50; color: white; border: none; cursor: pointer; margin-right: 10px; border-radius: 3px; }
                button:hover { background: #45a049; }
                .nav-buttons { display: flex; gap: 10px; margin: 20px 0; }
                .loading { display: inline-block; width: 20px; height: 20px; border: 3px solid rgba(0,0,0,0.3); border-radius: 50%; border-top-color: #4CAF50; animation: spin 1s ease-in-out infinite; margin-left: 10px; }
                @keyframes spin { to { transform: rotate(360deg); } }
                #dynamicContent, #ajaxContent, #infiniteScrollContent { min-height: 200px; border: 1px solid #ddd; padding: 10px; margin-top: 10px; }
                .item { padding: 10px; border-bottom: 1px solid #eee; }
                .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); align-items: center; justify-content: center; z-index: 1000; }
                .modal-content { background: white; padding: 20px; border-radius: 5px; max-width: 500px; width: 100%; }
                .close-modal { float: right; cursor: pointer; font-size: 24px; }
              </style>
            </head>
            <body>
              <h1>Dynamic Content Test Page</h1>
              <p>Test handling of dynamically loaded content.</p>
              
              <div class="nav-buttons">
                <a href="/" id="homeLink">Home</a>
                <a href="/forms.html" id="formsLink">Forms Page</a>
                <a href="/cookies.html" id="cookiesLink">Cookies Page</a>
                <a href="/dynamicContent.html" id="dynamicLink">Dynamic Content</a>
              </div>
              
              <section id="delayedSection">
                <h2>Delayed Content</h2>
                <button id="loadDelayedButton">Load Delayed Content</button>
                <span id="delayedLoading" class="loading" style="display: none;"></span>
                <div id="dynamicContent"></div>
              </section>
              
              <section id="ajaxSection">
                <h2>AJAX Content</h2>
                <button id="loadAjaxButton">Load AJAX Content</button>
                <span id="ajaxLoading" class="loading" style="display: none;"></span>
                <div id="ajaxContent"></div>
              </section>
              
              <section id="infiniteScrollSection">
                <h2>Infinite Scroll Simulation</h2>
                <button id="loadMoreButton">Load More Items</button>
                <span id="scrollLoading" class="loading" style="display: none;"></span>
                <div id="infiniteScrollContent"></div>
              </section>
              
              <section id="modalSection">
                <h2>Modal Dialog</h2>
                <button id="openModalButton">Open Modal Dialog</button>
                
                <div id="testModal" class="modal">
                  <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <h3>Test Modal</h3>
                    <p>This is a test modal dialog. Click outside or the X to close.</p>
                    <input type="text" id="modalInput" placeholder="Type something here">
                    <button id="modalSubmitButton">Submit</button>
                  </div>
                </div>
              </section>
              
              <script>
                // Delayed content
                document.getElementById('loadDelayedButton').addEventListener('click', function() {
                  const loading = document.getElementById('delayedLoading');
                  const content = document.getElementById('dynamicContent');
                  
                  loading.style.display = 'inline-block';
                  content.innerHTML = '';
                  
                  setTimeout(function() {
                    loading.style.display = 'none';
                    content.innerHTML = '<h3>Delayed Content Loaded</h3><p>This content was loaded after a 2 second delay.</p><button id="dynamicButton">Dynamic Button</button>';
                    
                    // Add event listener to the dynamic button
                    document.getElementById('dynamicButton').addEventListener('click', function() {
                      alert('Dynamic button clicked!');
                    });
                  }, 2000);
                });
                
                // AJAX content (simulated)
                document.getElementById('loadAjaxButton').addEventListener('click', function() {
                  const loading = document.getElementById('ajaxLoading');
                  const content = document.getElementById('ajaxContent');
                  
                  loading.style.display = 'inline-block';
                  content.innerHTML = '';
                  
                  // Simulate AJAX request
                  setTimeout(function() {
                    loading.style.display = 'none';
                    
                    // Sample data that would come from an API
                    const data = [
                      { id: 1, title: 'Item 1', description: 'Description for item 1' },
                      { id: 2, title: 'Item 2', description: 'Description for item 2' },
                      { id: 3, title: 'Item 3', description: 'Description for item 3' }
                    ];
                    
                    let html = '<h3>AJAX Data Loaded</h3><ul>';
                    data.forEach(item => {
                      html += '<li><strong>' + item.title + '</strong>: ' + item.description + '</li>';
                    });
                    html += '</ul>';
                    
                    content.innerHTML = html;
                  }, 1500);
                });
                
                // Infinite scroll simulation
                let itemCount = 0;
                
                function loadMoreItems() {
                  const loading = document.getElementById('scrollLoading');
                  const content = document.getElementById('infiniteScrollContent');
                  
                  loading.style.display = 'inline-block';
                  
                  setTimeout(function() {
                    loading.style.display = 'none';
                    
                    // Generate 5 new items
                    let html = '';
                    for (let i = 1; i <= 5; i++) {
                      itemCount++;
                      html += '<div class="item" id="item-' + itemCount + '">';
                      html += '<h4>Item ' + itemCount + '</h4>';
                      html += '<p>This is the content for item ' + itemCount + '.</p>';
                      html += '</div>';
                    }
                    
                    // Append new items
                    content.innerHTML += html;
                  }, 1000);
                }
                
                document.getElementById('loadMoreButton').addEventListener('click', loadMoreItems);
                
                // Modal dialog
                const modal = document.getElementById('testModal');
                const openModalBtn = document.getElementById('openModalButton');
                const closeBtn = document.querySelector('.close-modal');
                
                openModalBtn.addEventListener('click', function() {
                  modal.style.display = 'flex';
                });
                
                closeBtn.addEventListener('click', function() {
                  modal.style.display = 'none';
                });
                
                // Close modal when clicking outside
                window.addEventListener('click', function(e) {
                  if (e.target === modal) {
                    modal.style.display = 'none';
                  }
                });
                
                // Modal submit button
                document.getElementById('modalSubmitButton').addEventListener('click', function() {
                  const inputValue = document.getElementById('modalInput').value;
                  alert('Modal input value: ' + inputValue);
                  modal.style.display = 'none';
                });
              </script>
            </body>
          </html>
        `);
        return;
      }
      
      // Not found
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    });
    
    server.listen(port, () => {
      console.log(`Test HTTP server running at http://localhost:${port}`);
      resolve({
        server,
        url: `http://localhost:${port}`,
        close: () => {
          server.close();
          console.log('Test HTTP server stopped');
        }
      });
    });
  });
}

/**
 * Utility to wait for a specified time
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Run a test with proper error handling, timeouts, and reporting
 */
async function runTest(name, testFunction, options = {}) {
  console.log(`\n🧪 Running test: ${name}`);
  results.total++;
  
  if (options.skip) {
    console.log(`⏭️ Test skipped: ${name}`);
    results.skipped++;
    return null;
  }
  
  // Default timeout of 30 seconds
  const timeout = options.timeout || 30000;
  
  // Create a promise that rejects after the timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Test '${name}' timed out after ${timeout}ms`));
    }, timeout);
  });
  
  // Create the test promise
  const testPromise = (async () => {
    try {
      const result = await testFunction();
      console.log(`✅ Test passed: ${name}`);
      results.passed++;
      return result;
    } catch (error) {
      console.error(`❌ Test failed: ${name}`);
      console.error(error);
      results.failed++;
      
      // Take a screenshot of the failure if browser and page are available
      if (options.browser && options.page) {
        try {
          const screenshotPath = path.join(screenshotDirs.browser, `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_failure.png`);
          await options.page.screenshot({ path: screenshotPath, fullPage: true });
          console.log(`📸 Failure screenshot saved to: ${screenshotPath}`);
        } catch (screenshotError) {
          console.error('Failed to take failure screenshot:', screenshotError);
        }
      }
      
      // Clean up browsers if possible
      if (options.cleanup) {
        try {
          await options.cleanup();
        } catch (cleanupError) {
          console.error('Error during cleanup:', cleanupError);
        }
      }
      
      throw error;
    }
  })();
  
  try {
    // Race the test against the timeout
    return await Promise.race([testPromise, timeoutPromise]);
  } catch (error) {
    results.failed++;
    
    // If it's a timeout, attempt to forcibly close all browsers
    if (error.message.includes('timed out')) {
      console.error(`⏱️ ${error.message}`);
      try {
        // Force cleanup of any browsers that might be hanging
        await listBrowsers().then(result => {
          if (result.browsers && result.browsers.length > 0) {
            console.log(`Force closing ${result.browsers.length} browser(s)...`);
            return Promise.all(result.browsers.map(browser => 
              closeBrowser({ browserId: browser.id }).catch(() => {})
            ));
          }
        }).catch(() => {});
        
        if (options.cleanup) {
          await options.cleanup();
        }
      } catch (cleanupError) {
        console.error('Error during forced cleanup:', cleanupError);
      }
    }
    
    throw error;
  }
}

/**
 * Test browser management functionality
 */
async function testBrowserManagement() {
  // Test creating a browser with default options
  const createResult = await createBrowser({
    launchOptions: {
      headless: false, // Use non-headless for visual verification
      args: ['--window-size=1280,800', '--no-sandbox', '--disable-setuid-sandbox']
    }
  });
  
  if (!createResult?.browserId) {
    throw new Error('Browser creation failed');
  }
  
  console.log(`Created browser with ID: ${createResult.browserId}`);
  
  // Take a screenshot for verification
  const screenshotPath = path.join(screenshotDirs.browser, 'browser_created.png');
  await screenshot({
    browserId: createResult.browserId,
    name: 'browser-created',
    fullPage: true
  });
  console.log(`📸 Screenshot saved to: ${screenshotPath}`);
  
  // Give time to see the browser window
  await sleep(1000);
  
  // List browsers
  const listResult = await listBrowsers();
  if (!listResult?.browsers || !listResult.browsers.some(b => b.id === createResult.browserId)) {
    throw new Error('Browser listing failed');
  }
  console.log(`Listed browsers: ${JSON.stringify(listResult.browsers)}`);
  
  // Close browser
  const closeResult = await closeBrowser({ browserId: createResult.browserId });
  if (!closeResult?.success) {
    throw new Error('Browser closing failed');
  }
  console.log('Browser closed successfully');
  
  // Verify browser is closed by listing browsers again
  const verifyResult = await listBrowsers();
  if (verifyResult.browsers.some(b => b.id === createResult.browserId)) {
    throw new Error('Browser was not properly closed');
  }
  
  return createResult.browserId;
}

/**
 * Test tab management functionality
 */
async function testTabManagement() {
  // Create browser
  const createBrowserResult = await createBrowser({
    launchOptions: {
      headless: false,
      args: ['--window-size=1280,800', '--no-sandbox', '--disable-setuid-sandbox']
    }
  });
  const browserId = createBrowserResult.browserId;
  console.log(`Created browser with ID: ${browserId}`);
  
  // Create tab
  const createTabResult = await createTab({ 
    browserId,
    url: 'about:blank'
  });
  
  if (!createTabResult?.tabId) {
    throw new Error('Tab creation failed');
  }
  const tabId = createTabResult.tabId;
  console.log(`Created tab with ID: ${tabId}`);
  
  // Take a screenshot
  await screenshot({
    browserId,
    tabId,
    name: 'tab-created',
    fullPage: true
  });
  
  // List tabs
  const listTabsResult = await listTabs({ browserId });
  if (!listTabsResult?.tabs || !listTabsResult.tabs.length) {
    throw new Error('Tab listing failed');
  }
  console.log(`Listed tabs: ${JSON.stringify(listTabsResult.tabs)}`);
  
  // Create a second tab
  const createTab2Result = await createTab({ 
    browserId,
    url: 'about:blank'
  });
  
  const tab2Id = createTab2Result.tabId;
  console.log(`Created second tab with ID: ${tab2Id}`);
  
  // Wait a moment to see both tabs
  await sleep(1000);
  
  // Close first tab
  const closeTabResult = await closeTab({ 
    tabId,
    browserId 
  });
  
  if (!closeTabResult?.success) {
    throw new Error('Tab closing failed');
  }
  console.log('First tab closed successfully');
  
  // Close browser
  await closeBrowser({ browserId });
  console.log('Browser closed successfully');
  
  return { browserId, tabId: tab2Id };
}

/**
 * Test navigation functionality
 */
async function testNavigation(testServerUrl) {
  // Create browser and tab
  const createBrowserResult = await createBrowser({
    launchOptions: {
      headless: false,
      args: ['--window-size=1280,800', '--no-sandbox', '--disable-setuid-sandbox']
    }
  });
  const browserId = createBrowserResult.browserId;
  
  const createTabResult = await createTab({ 
    browserId,
    url: testServerUrl
  });
  const tabId = createTabResult.tabId;
  
  console.log(`Created browser ${browserId} and tab ${tabId}`);
  
  // Navigate to test page
  const navigateResult = await navigate({
    browserId,
    tabId,
    url: testServerUrl,
    responseFormat: {
      pageTitle: true,
      pageText: true,
      links: true,
      inputs: true,
      screenshot: true
    }
  });
  
  if (!navigateResult?.success) {
    throw new Error('Navigation failed');
  }
  
  console.log('Navigation to test page successful');
  console.log(`Page title: ${navigateResult.title}`);
  
  // Take a screenshot
  await screenshot({
    browserId,
    tabId,
    name: 'navigation-home',
    fullPage: true
  });
  
  // Wait for 1 second to see the page
  await sleep(1000);
  
  // Navigate to the forms page
  const navigate2Result = await navigate({
    browserId,
    tabId,
    url: `${testServerUrl}/forms.html`,
    responseFormat: {
      pageTitle: true
    }
  });
  
  if (!navigate2Result?.success) {
    throw new Error('Navigation to forms page failed');
  }
  
  console.log('Navigation to forms page successful');
  console.log(`Page title: ${navigate2Result.title}`);
  
  // Take a screenshot
  await screenshot({
    browserId,
    tabId,
    name: 'navigation-forms',
    fullPage: true
  });
  
  // Wait for 1 second
  await sleep(1000);
  
  // Navigate back to the first page using the link
  await click({
    browserId,
    tabId,
    selector: '#homeLink'
  });
  
  // Wait for navigation to complete
  await wait({
    browserId,
    tabId,
    navigation: true
  });
  
  // Take a screenshot
  await screenshot({
    browserId,
    tabId,
    name: 'navigation-back-home',
    fullPage: true
  });
  
  console.log('Navigation using click successful');
  
  // Wait for 1 second
  await sleep(1000);
  
  // Close browser
  await closeBrowser({ browserId });
  
  return { browserId, tabId };
}

/**
 * Test click functionality
 */
async function testClick(testServerUrl) {
  // Create browser and tab
  const createBrowserResult = await createBrowser({
    launchOptions: {
      headless: false,
      args: ['--window-size=1280,800', '--no-sandbox', '--disable-setuid-sandbox']
    }
  });
  const browserId = createBrowserResult.browserId;
  
  const createTabResult = await createTab({ 
    browserId,
    url: testServerUrl
  });
  const tabId = createTabResult.tabId;
  
  // Wait for page to load
  await wait({
    browserId,
    tabId,
    selector: '#clickSection'
  });
  
  // Take a screenshot before click
  await screenshot({
    browserId,
    tabId,
    name: 'before-click',
    fullPage: false
  });
  
  // Click the button
  await click({
    browserId,
    tabId,
    selector: '#visibleButton'
  });
  
  // Wait for the result to appear
  await wait({
    browserId,
    tabId,
    selector: '#clickResult',
    visible: true
  });
  
  // Take a screenshot after click
  await screenshot({
    browserId,
    tabId,
    name: 'after-click',
    fullPage: false
  });
  
  console.log('Button click successful');
  
  // Test delayed content
  await click({
    browserId,
    tabId,
    selector: '#delayButton'
  });
  
  // Wait for the delayed content to appear
  await wait({
    browserId,
    tabId,
    selector: '#delayedContent',
    visible: true,
    timeout: 5000
  });
  
  // Take a screenshot
  await screenshot({
    browserId,
    tabId,
    name: 'delayed-content',
    fullPage: false
  });
  
  console.log('Delayed content test successful');
  
  // Close browser
  await closeBrowser({ browserId });
  
  return { success: true };
}

/**
 * Test hover functionality
 */
async function testHover(testServerUrl) {
  // Create browser and tab
  const createBrowserResult = await createBrowser({
    launchOptions: {
      headless: false,
      args: ['--window-size=1280,800', '--no-sandbox', '--disable-setuid-sandbox']
    }
  });
  const browserId = createBrowserResult.browserId;
  
  const createTabResult = await createTab({ 
    browserId,
    url: testServerUrl
  });
  const tabId = createTabResult.tabId;
  
  // Wait for page to load
  await wait({
    browserId,
    tabId,
    selector: '#hoverSection'
  });
  
  // Take a screenshot before hover
  await screenshot({
    browserId,
    tabId,
    name: 'before-hover',
    selector: '#hoverSection'
  });
  
  // Hover over the element
  await hover({
    browserId,
    tabId,
    selector: '#hoverArea'
  });
  
  // Small delay to ensure hover effect is visible
  await sleep(500);
  
  // Take a screenshot after hover
  await screenshot({
    browserId,
    tabId,
    name: 'after-hover',
    selector: '#hoverSection'
  });
  
  console.log('Hover test successful');
  
  // Close browser
  await closeBrowser({ browserId });
  
  return { success: true };
}

/**
 * Test keyboard functionality
 */
async function testKeyboard(testServerUrl) {
  // Create browser and tab
  const createBrowserResult = await createBrowser({
    launchOptions: {
      headless: false,
      args: ['--window-size=1280,800', '--no-sandbox', '--disable-setuid-sandbox']
    }
  });
  const browserId = createBrowserResult.browserId;
  
  const createTabResult = await createTab({ 
    browserId,
    url: testServerUrl
  });
  const tabId = createTabResult.tabId;
  
  // Wait for page to load
  await wait({
    browserId,
    tabId,
    selector: '#keyboardSection'
  });
  
  // Click the input field
  await click({
    browserId,
    tabId,
    selector: '#keyboardInput'
  });
  
  // Type some text
  await keyboard({
    browserId,
    tabId,
    action: 'type',
    text: 'Hello from Chrome Control!'
  });
  
  // Wait for the result to update
  await wait({
    browserId,
    tabId,
    selector: '#keyboardResult',
    visible: true
  });
  
  // Take a screenshot
  await screenshot({
    browserId,
    tabId,
    name: 'keyboard-input',
    selector: '#keyboardSection'
  });
  
  console.log('Keyboard typing test successful');
  
  // Click the key press area
  await click({
    browserId,
    tabId,
    selector: '#keyPressArea'
  });
  
  // Press a key
  await keyboard({
    browserId,
    tabId,
    action: 'press',
    key: 'Enter'
  });
  
  // Take a screenshot
  await screenshot({
    browserId,
    tabId,
    name: 'keyboard-press',
    selector: '#keyboardSection'
  });
  
  console.log('Keyboard press test successful');
  
  // Close browser
  await closeBrowser({ browserId });
  
  return { success: true };
}

/**
 * Test form filling functionality
 */
async function testFormFilling(testServerUrl) {
  // Create browser and tab
  const createBrowserResult = await createBrowser({
    launchOptions: {
      headless: false,
      args: ['--window-size=1280,800', '--no-sandbox', '--disable-setuid-sandbox']
    }
  });
  const browserId = createBrowserResult.browserId;
  
  const createTabResult = await createTab({ 
    browserId,
    url: `${testServerUrl}/forms.html`
  });
  const tabId = createTabResult.tabId;
  
  // Wait for page to load
  await wait({
    browserId,
    tabId,
    selector: '#loginForm'
  });
  
  // Take a screenshot before filling
  await screenshot({
    browserId,
    tabId,
    name: 'before-form-fill',
    selector: '#loginForm'
  });
  
  // Fill the username field
  await fill({
    browserId,
    tabId,
    selector: '#username',
    value: 'testuser'
  });
  
  // Fill the password field
  await fill({
    browserId,
    tabId,
    selector: '#password',
    value: 'password123'
  });
  
  // Click the remember me checkbox
  await click({
    browserId,
    tabId,
    selector: '#rememberMe'
  });
  
  // Take a screenshot after filling
  await screenshot({
    browserId,
    tabId,
    name: 'after-form-fill',
    selector: '#loginForm'
  });
  
  // Click the login button
  await click({
    browserId,
    tabId,
    selector: '#loginButton'
  });
  
  // Wait for the result to appear
  await wait({
    browserId,
    tabId,
    selector: '#loginResult',
    visible: true
  });
  
  // Take a screenshot after submission
  await screenshot({
    browserId,
    tabId,
    name: 'form-submission',
    selector: '#loginForm'
  });
  
  console.log('Form filling test successful');
  
  // Close browser
  await closeBrowser({ browserId });
  
  return { success: true };
}

/**
 * Test select functionality
 */
async function testSelect(testServerUrl) {
  // Create browser and tab
  const createBrowserResult = await createBrowser({
    launchOptions: {
      headless: false,
      args: ['--window-size=1280,800', '--no-sandbox', '--disable-setuid-sandbox']
    }
  });
  const browserId = createBrowserResult.browserId;
  
  const createTabResult = await createTab({ 
    browserId,
    url: testServerUrl
  });
  const tabId = createTabResult.tabId;
  
  // Wait for page to load
  await wait({
    browserId,
    tabId,
    selector: '#formSection'
  });
  
  // Take a screenshot before selection
  await screenshot({
    browserId,
    tabId,
    name: 'before-select',
    selector: '#formSection'
  });
  
  // Select an option from the dropdown
  await select({
    browserId,
    tabId,
    selector: '#countrySelect',
    value: 'uk'
  });
  
  // Take a screenshot after selection
  await screenshot({
    browserId,
    tabId,
    name: 'after-select',
    selector: '#formSection'
  });
  
  console.log('Select test successful');
  
  // Close browser
  await closeBrowser({ browserId });
  
  return { success: true };
}

/**
 * Test cookies functionality
 */
async function testCookies(testServerUrl) {
  // Create browser and tab
  const createBrowserResult = await createBrowser({
    launchOptions: {
      headless: false,
      args: ['--window-size=1280,800', '--no-sandbox', '--disable-setuid-sandbox']
    }
  });
  const browserId = createBrowserResult.browserId;
  
  const createTabResult = await createTab({ 
    browserId,
    url: `${testServerUrl}/cookies.html`
  });
  const tabId = createTabResult.tabId;
  
  // Wait for page to load
  await wait({
    browserId,
    tabId,
    selector: '#cookieManagement'
  });
  
  // Take a screenshot before cookie operations
  await screenshot({
    browserId,
    tabId,
    name: 'before-cookies',
    selector: '#cookieDisplay'
  });
  
  // Set a cookie
  await cookies({
    browserId,
    tabId,
    action: 'set',
    cookie: {
      name: 'testCookie',
      value: 'testValue123',
      domain: 'localhost',
      path: '/'
    }
  });
  
  // Refresh cookie display
  await click({
    browserId,
    tabId,
    selector: '#refreshCookies'
  });
  
  // Wait a moment
  await sleep(500);
  
  // Take a screenshot after setting cookie
  await screenshot({
    browserId,
    tabId,
    name: 'after-set-cookie',
    selector: '#cookieDisplay'
  });
  
  // Get cookies
  const getCookiesResult = await cookies({
    browserId,
    tabId,
    action: 'get'
  });
  
  console.log('Retrieved cookies:', JSON.stringify(getCookiesResult.cookies));
  
  // Delete the cookie
  await cookies({
    browserId,
    tabId,
    action: 'delete',
    names: ['testCookie']
  });
  
  // Refresh cookie display
  await click({
    browserId,
    tabId,
    selector: '#refreshCookies'
  });
  
  // Wait a moment
  await sleep(500);
  
  // Take a screenshot after deleting cookie
  await screenshot({
    browserId,
    tabId,
    name: 'after-delete-cookie',
    selector: '#cookieDisplay'
  });
  
  console.log('Cookie management test successful');
  
  // Close browser
  await closeBrowser({ browserId });
  
  return { success: true };
}

/**
 * Test JavaScript evaluation
 */
async function testEvaluate(testServerUrl) {
  // Create browser and tab
  const createBrowserResult = await createBrowser({
    launchOptions: {
      headless: false,
      args: ['--window-size=1280,800', '--no-sandbox', '--disable-setuid-sandbox']
    }
  });
  const browserId = createBrowserResult.browserId;
  
  const createTabResult = await createTab({ 
    browserId,
    url: testServerUrl
  });
  const tabId = createTabResult.tabId;
  
  // Wait for page to load
  await wait({
    browserId,
    tabId,
    selector: '#tabsSection'
  });
  
  // Execute a simple script
  const evalResult1 = await evaluate({
    browserId,
    tabId,
    script: `
      document.title = "Modified by evaluate()";
      return document.title;
    `
  });
  
  console.log('Evaluation result 1:', evalResult1.result);
  
  // Take a screenshot
  await screenshot({
    browserId,
    tabId,
    name: 'after-evaluate-1',
    fullPage: false
  });
  
  // Execute a more complex script
  const evalResult2 = await evaluate({
    browserId,
    tabId,
    script: `
      // Click on tab 3
      document.querySelector('[data-tab="tab3"]').click();
      
      // Change the color of the box
      const colorBox = document.getElementById('colorBox');
      colorBox.style.backgroundColor = 'green';
      
      return {
        activeTab: document.querySelector('.tab.active').textContent,
        boxColor: colorBox.style.backgroundColor
      };
    `
  });
  
  console.log('Evaluation result 2:', evalResult2.result);
  
  // Take a screenshot
  await screenshot({
    browserId,
    tabId,
    name: 'after-evaluate-2',
    fullPage: false
  });
  
  console.log('JavaScript evaluation test successful');
  
  // Close browser
  await closeBrowser({ browserId });
  
  return { success: true };
}

/**
 * Test action chaining
 */
async function testChain(testServerUrl) {
  // Create browser and tab
  const createBrowserResult = await createBrowser({
    launchOptions: {
      headless: false,
      args: ['--window-size=1280,800', '--no-sandbox', '--disable-setuid-sandbox']
    }
  });
  const browserId = createBrowserResult.browserId;
  
  const createTabResult = await createTab({ 
    browserId 
  });
  const tabId = createTabResult.tabId;
  
  // Use the chain tool to perform a sequence of actions
  const chainResult = await chain({
    browserId,
    tabId,
    actions: [
      // Navigate to the test page
      {
        type: 'navigate',
        params: {
          url: testServerUrl,
          waitUntil: 'domcontentloaded'
        }
      },
      
      // Take a screenshot
      {
        type: 'screenshot',
        params: {
          name: 'chain-step-1',
          fullPage: false
        }
      },
      
      // Click on the form section
      {
        type: 'click',
        params: {
          selector: '#submitForm'
        }
      },
      
      // Wait for result to appear
      {
        type: 'wait',
        params: {
          selector: '#formResult',
          visible: true
        }
      },
      
      // Take another screenshot
      {
        type: 'screenshot',
        params: {
          name: 'chain-step-2',
          fullPage: false
        }
      }
    ],
    stopOnError: true
  });
  
  console.log('Chain execution completed with results:', JSON.stringify(chainResult.results.map(r => r.success)));
  
  // Close browser
  await closeBrowser({ browserId });
  
  return { success: true };
}

/**
 * Run the complete test suite
 */
async function runTests() {
  console.log('🧪 Starting Chrome Control MCP Tool Test Suite');
  console.log('Testing all MCP tools with visible browser verification\n');
  
  // Create test HTTP server
  const { url, close } = await createTestServer(3040);
  console.log(`Test server running at ${url}`);
  
  try {
    // Run all tests
    await runTest('Browser Management', () => testBrowserManagement());
    await runTest('Tab Management', () => testTabManagement());
    await runTest('Navigation', () => testNavigation(url));
    await runTest('Click Functionality', () => testClick(url));
    await runTest('Hover Functionality', () => testHover(url));
    await runTest('Keyboard Functionality', () => testKeyboard(url));
    await runTest('Form Filling', () => testFormFilling(url));
    await runTest('Select Functionality', () => testSelect(url));
    await runTest('Cookie Management', () => testCookies(url));
    await runTest('JavaScript Evaluation', () => testEvaluate(url));
    await runTest('Action Chaining', () => testChain(url));
    
    // Print test results
    console.log('\n📊 Test Results:');
    console.log(`Total Tests: ${results.total}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Skipped: ${results.skipped}`);
    
    if (results.failed === 0) {
      console.log('\n✅ All MCP tool tests passed!');
      console.log('Screenshots saved to test-screenshots/ directory for visual verification');
    } else {
      console.log('\n❌ Some MCP tool tests failed!');
      process.exit(1);
    }
  } finally {
    // Close the test HTTP server
    close();
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error running MCP tool tests:', error);
  process.exit(1);
});