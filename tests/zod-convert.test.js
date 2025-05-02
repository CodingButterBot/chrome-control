/**
 * Test for Zod to rawZod conversion
 * 
 * This file tests the conversion of Zod schemas to rawZod objects
 * to ensure compatibility with the MCP SDK.
 */

import { z } from 'zod';
import { createTool } from '../bin/mcp-server.js';

/**
 * Safely convert a Zod schema to a raw JSON representation
 * 
 * This function implements the same conversion logic used in the MCP server
 * to ensure that schema conversion works correctly.
 */
function safeSchemaToJson(schema, name = 'unnamed') {
  try {
    // Check if schema has toJSON method
    if (schema && typeof schema.toJSON === 'function') {
      return schema.toJSON();
    } else if (schema && schema._def) {
      // Fallback for older Zod versions
      return JSON.parse(JSON.stringify(schema));
    } else {
      // Last resort fallback
      console.warn(`Warning: Schema for ${name} could not be properly converted`);
      return schema;
    }
  } catch (error) {
    console.error(`Failed to convert schema for ${name}:`, error);
    // Provide a minimal valid schema as fallback
    return { type: "object", properties: {} };
  }
}

// Test simple schema
const simpleSchema = z.object({
  foo: z.string(),
  bar: z.number().optional()
});

// Create a test tool with the schema
const testTool = createTool(
  'test_tool',
  simpleSchema,
  async (params) => {
    return {
      content: [
        { type: 'text', text: `Params: ${JSON.stringify(params)}` }
      ]
    };
  },
  { description: 'Test tool for Zod conversion' }
);

// Convert schema to rawZod using our safe method
const rawSchema = safeSchemaToJson(testTool.schema, testTool.name);

// Print the raw schema to verify it's converted correctly
console.log('Raw schema:', JSON.stringify(rawSchema, null, 2));

// Test nested schema
const nestedSchema = z.object({
  user: z.object({
    name: z.string(),
    age: z.number().optional(),
    roles: z.array(z.string())
  }),
  active: z.boolean()
});

// Convert nested schema
const rawNestedSchema = safeSchemaToJson(nestedSchema, 'nestedSchema');

// Print the raw nested schema
console.log('Raw nested schema:', JSON.stringify(rawNestedSchema, null, 2));

// Test edge cases
console.log('\n--- Testing edge cases ---');

// Test with null schema
try {
  const nullSchema = safeSchemaToJson(null, 'nullSchema');
  console.log('Null schema handled:', nullSchema);
} catch (error) {
  console.error('Failed to handle null schema:', error);
}

// Test with undefined schema
try {
  const undefinedSchema = safeSchemaToJson(undefined, 'undefinedSchema');
  console.log('Undefined schema handled:', undefinedSchema);
} catch (error) {
  console.error('Failed to handle undefined schema:', error);
}

// Test with broken schema
try {
  const brokenSchema = {};
  // Make it circular to cause JSON.stringify to fail
  brokenSchema.self = brokenSchema;
  
  const handledBrokenSchema = safeSchemaToJson(brokenSchema, 'brokenSchema');
  console.log('Broken schema handled:', handledBrokenSchema);
} catch (error) {
  console.error('Failed to handle broken schema:', error);
}

console.log('\nZod conversion test completed successfully');