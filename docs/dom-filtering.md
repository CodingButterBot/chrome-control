# DOM Query Filtering

## Overview

Chrome Control provides powerful DOM query filtering capabilities that help reduce token usage by returning only the most relevant content from web pages. When working with LLMs, this feature is critical for optimizing the amount of data exchanged.

## Filter Options

The DOM filtering system provides these filtering options:

| Option | Type | Description |
|--------|------|-------------|
| `includeElements` | string[] | Only include elements with these tag names (e.g., 'div', 'a', 'input') |
| `excludeElements` | string[] | Exclude elements with these tag names |
| `maxElements` | number | Maximum number of elements to return |
| `maxTextLength` | number | Maximum text length for each element (truncates with "...") |
| `textFilter` | string | Only include elements containing this text |
| `attributeFilter` | object[] | Filter elements by specific attribute values |

### Attribute Filtering

The `attributeFilter` option accepts an array of objects with the following properties:

```json
{
  "name": "attributeName",     // Name of the attribute to check
  "value": "attributeValue",   // Value to match
  "partial": true              // Whether to use partial matching (includes)
}
```

## Usage Examples

### Basic Element Filtering

To get only the first 5 links on a page:

```json
{
  "responseFormat": {
    "elements": {
      "selector": "a",
      "includeText": true,
      "filter": {
        "maxElements": 5
      }
    }
  }
}
```

### Text Content Filtering

To find elements containing specific text:

```json
{
  "responseFormat": {
    "elements": {
      "selector": ".product-item",
      "includeText": true,
      "filter": {
        "textFilter": "Sale"
      }
    }
  }
}
```

### Attribute-based Filtering

To find elements with specific attributes:

```json
{
  "responseFormat": {
    "elements": {
      "selector": "input",
      "attributes": ["name", "id", "placeholder"],
      "filter": {
        "attributeFilter": [
          {
            "name": "placeholder",
            "value": "search",
            "partial": true
          }
        ]
      }
    }
  }
}
```

### Filtering Inputs

To get only required form fields:

```json
{
  "responseFormat": {
    "inputs": true,
    "filter": {
      "attributeFilter": [
        {
          "name": "required",
          "value": "true"
        }
      ]
    }
  }
}
```

### Limiting Text Length

To truncate long text contents:

```json
{
  "responseFormat": {
    "elements": {
      "selector": "p",
      "includeText": true,
      "filter": {
        "maxTextLength": 100
      }
    }
  }
}
```

## Global vs. Element-specific Filtering

You can apply filters at multiple levels:

1. **Element-specific**: Apply filters only to elements returned by a specific selector:

```json
"elements": {
  "selector": ".product-item",
  "filter": {
    "maxElements": 5
  }
}
```

2. **Global**: Apply filters to all content types (links, inputs, etc.):

```json
"responseFormat": {
  "links": true,
  "inputs": true,
  "filter": {
    "maxElements": 10,
    "maxTextLength": 50
  }
}
```

## Performance Considerations

- Using filters can significantly reduce response size and token usage
- `maxElements` and `maxTextLength` are particularly effective for limiting response size
- For best performance, use specific selectors combined with targeted filters