/**
 * Response Format Validation Tests
 * 
 * Tests the validation of response format options.
 */

const assert = require('assert');
const { validateResponseFormat } = require('./index');

describe('validateResponseFormat Function', () => {
  it('should return false for undefined or null options', () => {
    assert.strictEqual(validateResponseFormat(undefined), false);
    assert.strictEqual(validateResponseFormat(null), false);
  });
  
  it('should return false when no format option is enabled', () => {
    const emptyOptions = {
      pageText: false,
      pageTitle: false,
      links: false,
      inputs: false,
      elements: undefined
    };
    
    assert.strictEqual(validateResponseFormat(emptyOptions), false);
  });
  
  it('should return true when at least one format option is enabled', () => {
    // With page text enabled
    const textOptions = {
      pageText: true,
      pageTitle: false,
      links: false,
      inputs: false,
      elements: undefined
    };
    assert.strictEqual(validateResponseFormat(textOptions), true);
    
    // With page title enabled
    const titleOptions = {
      pageText: false,
      pageTitle: true,
      links: false,
      inputs: false,
      elements: undefined
    };
    assert.strictEqual(validateResponseFormat(titleOptions), true);
    
    // With links enabled
    const linksOptions = {
      pageText: false,
      pageTitle: false,
      links: true,
      inputs: false,
      elements: undefined
    };
    assert.strictEqual(validateResponseFormat(linksOptions), true);
    
    // With inputs enabled
    const inputsOptions = {
      pageText: false,
      pageTitle: false,
      links: false,
      inputs: true,
      elements: undefined
    };
    assert.strictEqual(validateResponseFormat(inputsOptions), true);
  });
  
  it('should return false when elements is defined but has no selector', () => {
    const invalidElements = {
      pageText: false,
      pageTitle: false,
      links: false,
      inputs: false,
      elements: {} // Missing selector
    };
    
    assert.strictEqual(validateResponseFormat(invalidElements), false);
  });
  
  it('should return true when elements has a valid selector', () => {
    const validElements = {
      pageText: false,
      pageTitle: false,
      links: false,
      inputs: false,
      elements: {
        selector: 'body'
      }
    };
    
    assert.strictEqual(validateResponseFormat(validElements), true);
  });
  
  it('should validate complex format options', () => {
    // Complex valid options
    const validComplex = {
      pageText: false,
      pageTitle: true,
      links: true,
      inputs: false,
      elements: {
        selector: 'h1',
        attributes: ['class', 'id'],
        includeText: true
      }
    };
    
    assert.strictEqual(validateResponseFormat(validComplex), true);
    
    // Complex invalid options (missing selector)
    const invalidComplex = {
      pageText: false,
      pageTitle: true,
      links: true,
      inputs: false,
      elements: {
        attributes: ['class', 'id'],
        includeText: true
      }
    };
    
    assert.strictEqual(validateResponseFormat(invalidComplex), false);
  });
});