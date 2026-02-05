# mcx bug

## parser

ast/tag.ts : 
```html
  <div id="xxx">  aaaaa </div> 
```
parser:
```json
[
  {
    "start": {
      "data": "<div id=\"xxx\">",
      "type": "Tag",
      "startIndex": 1,
      "endIndex": 14,
      "startLine": 1
    },
    "name": "div",
    "arr": {
      "id": "",
      "xxx\"": "true"
    },
    "content": [
      {
        "data": "  aaaaa ",
        "type": "TagContent"
      }
    ],
    "end": {
      "data": "</div>",
      "type": "TagEnd",
      "startIndex": 23,
      "endIndex": 28,
      "startLine": 1
    },
    "loc": {
      "start": {
        "line": 1,
        "index": 1
      },
      "end": {
        "line": 1,
        "index": 28
      }
    }
  }
]
```
In arr prop, this is not right parser