/**
 * Temporary Schema Fix
 * 
 * This script provides a temporary fix for the Zod schema conversion issue.
 * Apply this fix by importing and using the safeSchemaToJson function in your code.
 */

/**
 * Safely convert a Zod schema to a raw JSON representation
 * 
 * This function implements a more robust version of the schema conversion logic
 * to handle edge cases and prevent errors.
 * 
 * @param {any} schema - The Zod schema to convert
 * @param {string} name - The name of the schema/tool for logging
 * @returns {object} - A JSON-compatible representation of the schema
 */
export function safeSchemaToJson(schema, name = 'unnamed') {
  // Early return for null/undefined schemas
  if (schema === null || schema === undefined) {
    console.error(`Error: Schema for ${name} is ${schema === null ? 'null' : 'undefined'}`);
    return { type: "object", properties: {} };
  }

  try {
    // Check if schema has toJSON method (newer Zod versions)
    if (typeof schema.toJSON === 'function') {
      return schema.toJSON();
    } 
    // Check if schema has _def property (older Zod versions)
    else if (schema._def && typeof schema._def === 'object') {
      try {
        return JSON.parse(JSON.stringify(schema));
      } catch (jsonError) {
        console.error(`JSON serialization error for schema ${name}:`, jsonError);
        // Fallback to minimal schema
        return { type: "object", properties: {} };
      }
    } 
    // Last resort: schema may be a raw object already
    else if (typeof schema === 'object') {
      // Check if it's a raw schema directly
      if (schema.type || schema.properties) {
        return schema;
      }
      
      console.warn(`Warning: Schema for ${name} does not appear to be a valid Zod schema`);
      return { type: "object", properties: {} };
    } 
    // Invalid schema type
    else {
      console.error(`Error: Schema for ${name} has unexpected type: ${typeof schema}`);
      return { type: "object", properties: {} };
    }
  } catch (error) {
    console.error(`Failed to convert schema for ${name}:`, error);
    // Always provide a valid fallback schema
    return { type: "object", properties: {} };
  }
}

console.log("Schema fix loaded - apply to mcp-server.ts to resolve schema conversion issues");