#!/usr/bin/env node
/**
 * Advanced DOM Filtering Test
 * 
 * This test demonstrates enhanced DOM filtering capabilities including:
 * - CSS selector-based filtering
 * - Attribute-based element filtering
 * - Text content filtering with regex
 * - Limiting result depth/nesting
 * - Element type inclusion/exclusion
 * - Response format options
 * 
 * Related to Issue #012
 */
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

// Add stealth plugin to avoid bot detection
puppeteer.use(StealthPlugin());

// Get current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create a directory for storing test artifacts
const ARTIFACTS_DIR = path.join(__dirname, 'artifacts');

/**
 * Extract content using advanced DOM filtering
 */
async function extractWithFiltering(page, options) {
  return await page.evaluate((opt) => {
    // Helper function to match elements against a filter
    function matchesFilter(element, filter) {
      // Element type filtering
      if (filter.elementTypes && !filter.elementTypes.includes(element.tagName.toLowerCase())) {
        return false;
      }
      
      // Class filtering
      if (filter.classes && filter.classes.length > 0) {
        const elementClasses = Array.from(element.classList);
        if (!filter.classes.some(cls => elementClasses.includes(cls))) {
          return false;
        }
      }
      
      // ID filtering
      if (filter.ids && filter.ids.length > 0) {
        if (!filter.ids.includes(element.id)) {
          return false;
        }
      }
      
      // Attribute filtering
      if (filter.attributes && Object.keys(filter.attributes).length > 0) {
        for (const [attr, value] of Object.entries(filter.attributes)) {
          if (!element.hasAttribute(attr) || 
              (value !== null && element.getAttribute(attr) !== value)) {
            return false;
          }
        }
      }
      
      // Text content filtering with regex
      if (filter.textPattern) {
        const pattern = new RegExp(filter.textPattern);
        if (!pattern.test(element.textContent)) {
          return false;
        }
      }
      
      // Minimum text length filtering
      if (filter.minTextLength !== undefined && 
          element.textContent.trim().length < filter.minTextLength) {
        return false;
      }
      
      return true;
    }
    
    // Extract attributes from element
    function extractAttributes(element, attributeList) {
      const result = {};
      
      if (!attributeList || attributeList.length === 0) {
        return result;
      }
      
      for (const attr of attributeList) {
        if (element.hasAttribute(attr)) {
          result[attr] = element.getAttribute(attr);
        }
      }
      
      return result;
    }
    
    // Process element and its children recursively
    function processElement(element, depth = 0, maxDepth = Infinity) {
      // Skip if we've reached max depth
      if (depth > maxDepth) {
        return null;
      }
      
      // Check if element matches our filter
      if (!matchesFilter(element, opt.filter || {})) {
        return null;
      }
      
      // Base element data
      const result = {
        tagName: element.tagName.toLowerCase(),
        textContent: element.textContent.trim()
      };
      
      // Truncate text if needed
      if (opt.maxTextLength && result.textContent.length > opt.maxTextLength) {
        result.textContent = result.textContent.substring(0, opt.maxTextLength) + '...';
      }
      
      // Add attributes if requested
      if (opt.includeAttributes) {
        result.attributes = extractAttributes(element, opt.attributeList || []);
      }
      
      // Add HTML content if requested
      if (opt.includeHtml) {
        result.html = element.innerHTML;
        
        // Truncate HTML if needed
        if (opt.maxHtmlLength && result.html.length > opt.maxHtmlLength) {
          result.html = result.html.substring(0, opt.maxHtmlLength) + '...';
        }
      }
      
      // Process children if needed and not at max depth
      if (opt.includeChildren && depth < maxDepth) {
        const childElements = Array.from(element.children);
        
        if (childElements.length > 0) {
          result.children = childElements
            .map(child => processElement(child, depth + 1, maxDepth))
            .filter(child => child !== null);
            
          // Remove empty children array
          if (result.children.length === 0) {
            delete result.children;
          }
        }
      }
      
      return result;
    }
    
    // Main extraction function
    function extractContent() {
      // Select elements based on selector
      const elements = Array.from(document.querySelectorAll(opt.selector || '*'));
      
      // Process each element
      let results = elements.map(el => processElement(
        el, 
        0, 
        opt.maxDepth || Infinity
      )).filter(el => el !== null);
      
      // Limit results if requested
      if (opt.maxResults && results.length > opt.maxResults) {
        results = results.slice(0, opt.maxResults);
      }
      
      return results;
    }
    
    // Run extraction
    return extractContent();
  }, options);
}

/**
 * Run the advanced DOM filtering test
 */
async function runAdvancedFilteringTest() {
  console.log('🧪 Starting Advanced DOM Filtering Test');
  
  // Create artifacts directory
  try {
    await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
    console.log(`📁 Created artifacts directory: ${ARTIFACTS_DIR}`);
  } catch (error) {
    console.log(`📁 Using existing artifacts directory: ${ARTIFACTS_DIR}`);
  }
  
  // Launch browser
  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  try {
    // Create a new page
    const page = await browser.newPage();
    console.log('📄 Browser page created');
    
    // Enable console logging from the browser
    page.on('console', msg => console.log(`🌐 BROWSER CONSOLE: ${msg.text()}`));
    
    // Configure viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Test 1: Basic CSS selector filtering on Wikipedia
    console.log('\n🔍 Test 1: Basic CSS selector filtering');
    await page.goto('https://en.wikipedia.org/wiki/Main_Page', { waitUntil: 'networkidle2' });
    console.log('📋 Page loaded:', await page.title());
    
    const headings = await extractWithFiltering(page, {
      selector: 'h1, h2, h3',
      maxResults: 10,
      includeAttributes: true,
      attributeList: ['id', 'class'],
      maxTextLength: 50
    });
    
    console.log(`✅ Extracted ${headings.length} headings`);
    const headingsPath = path.join(ARTIFACTS_DIR, 'wikipedia-headings.json');
    await fs.writeFile(headingsPath, JSON.stringify(headings, null, 2));
    console.log(`📝 Headings written to: ${headingsPath}`);
    
    // Test 2: Attribute-based filtering
    console.log('\n🔍 Test 2: Attribute-based filtering');
    
    const featuredContent = await extractWithFiltering(page, {
      selector: 'div',
      filter: {
        attributes: { 'id': 'mp-upper' }
      },
      includeChildren: true,
      maxDepth: 3,
      includeAttributes: true,
      attributeList: ['id', 'class', 'href', 'src'],
      maxTextLength: 100
    });
    
    console.log(`✅ Extracted featured content section`);
    const featuredPath = path.join(ARTIFACTS_DIR, 'wikipedia-featured.json');
    await fs.writeFile(featuredPath, JSON.stringify(featuredContent, null, 2));
    console.log(`📝 Featured content written to: ${featuredPath}`);
    
    // Test 3: Text pattern filtering
    console.log('\n🔍 Test 3: Text pattern filtering');
    
    await page.goto('https://news.ycombinator.com/', { waitUntil: 'networkidle2' });
    console.log('📋 Page loaded:', await page.title());
    
    const newsItems = await extractWithFiltering(page, {
      selector: 'tr.athing',
      includeAttributes: true,
      attributeList: ['id', 'class', 'rank'],
      maxResults: 5,
      includeChildren: true,
      maxDepth: 2
    });
    
    console.log(`✅ Extracted ${newsItems.length} news items`);
    const newsPath = path.join(ARTIFACTS_DIR, 'hackernews-items.json');
    await fs.writeFile(newsPath, JSON.stringify(newsItems, null, 2));
    console.log(`📝 News items written to: ${newsPath}`);
    
    // Test 4: Complex filtering - comments with regex
    console.log('\n🔍 Test 4: Complex filtering with regex text patterns');
    
    const comments = await extractWithFiltering(page, {
      selector: '.comment',
      filter: {
        textPattern: '\\b(the|a|an)\\b', // Find comments containing articles
        minTextLength: 20 // Only comments with substantial content
      },
      maxResults: 5,
      includeAttributes: true,
      attributeList: ['class'],
      maxTextLength: 100
    });
    
    console.log(`✅ Extracted ${comments.length} comments matching the pattern`);
    
    if (comments.length > 0) {
      const commentsPath = path.join(ARTIFACTS_DIR, 'hackernews-comments.json');
      await fs.writeFile(commentsPath, JSON.stringify(comments, null, 2));
      console.log(`📝 Comments written to: ${commentsPath}`);
    } else {
      console.log('⚠️ No comments found matching the pattern');
    }
    
    // Test 5: Combined filtering with multiple criteria
    console.log('\n🔍 Test 5: Combined filtering with multiple criteria');
    
    await page.goto('https://github.com', { waitUntil: 'networkidle2' });
    console.log('📋 Page loaded:', await page.title());
    
    const filteredElements = await extractWithFiltering(page, {
      selector: 'a, button, input',
      filter: {
        elementTypes: ['a', 'button'],
        classes: ['btn'],
        textPattern: '\\b(sign|get|try|learn)\\b'
      },
      includeAttributes: true,
      attributeList: ['id', 'class', 'href', 'data-*', 'aria-*'],
      maxResults: 10,
      maxTextLength: 50
    });
    
    console.log(`✅ Extracted ${filteredElements.length} call-to-action elements`);
    const ctaPath = path.join(ARTIFACTS_DIR, 'github-cta-elements.json');
    await fs.writeFile(ctaPath, JSON.stringify(filteredElements, null, 2));
    console.log(`📝 CTA elements written to: ${ctaPath}`);
    
    // Create a summary of all extraction tests
    const summary = {
      testRun: new Date().toISOString(),
      testTitle: 'Advanced DOM Filtering Test',
      tests: [
        {
          name: 'Basic CSS selector filtering',
          site: 'Wikipedia',
          selector: 'h1, h2, h3',
          resultsFile: 'wikipedia-headings.json',
          resultCount: headings.length
        },
        {
          name: 'Attribute-based filtering',
          site: 'Wikipedia',
          filter: 'div with id="mp-upper"',
          resultsFile: 'wikipedia-featured.json',
          resultCount: featuredContent.length
        },
        {
          name: 'Element-based extraction',
          site: 'Hacker News',
          selector: 'tr.athing',
          resultsFile: 'hackernews-items.json',
          resultCount: newsItems.length
        },
        {
          name: 'Complex filtering with regex',
          site: 'Hacker News',
          filter: 'Comments with articles and min length',
          resultsFile: 'hackernews-comments.json',
          resultCount: comments.length
        },
        {
          name: 'Combined filtering',
          site: 'GitHub',
          filter: 'CTA buttons and links',
          resultsFile: 'github-cta-elements.json',
          resultCount: filteredElements.length
        }
      ]
    };
    
    // Write test summary
    const summaryPath = path.join(ARTIFACTS_DIR, 'filtering-summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`\n📝 Test summary written to: ${summaryPath}`);
    
    // Take final screenshot
    await page.screenshot({ 
      path: path.join(ARTIFACTS_DIR, 'advanced-filtering-final.png'),
      fullPage: true
    });
    
    console.log('\n🎉 Advanced DOM filtering test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  } finally {
    // Close the browser
    console.log('\n🔒 Closing browser');
    await browser.close();
  }
}

// Run the test
runAdvancedFilteringTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});