# JARVIS Web Search Configuration

## Updated Web Search Endpoint

JARVIS has been updated to use a **local search service** at `http://localhost:8081/` instead of DuckDuckGo API.

### What Changed
- **Old**: Used DuckDuckGo free API (https://api.duckduckgo.com/)
- **New**: Uses local search service at http://localhost:8081/

### Benefits
✅ Faster responses (local network)  
✅ No external API rate limits  
✅ Complete privacy (no external requests)  
✅ Custom search index support  
✅ Better control over search results  

## Setup Requirements

### Option 1: Use Your Own Search Service

If you have a search service running on port 8081, it should respond to requests like:
```
GET http://localhost:8081/?q=your+search+query
```

**Expected Response Format:**
```json
{
  "results": [
    {
      "snippet": "Result summary text",
      "url": "https://example.com",
      "source": "Example Source",
      "title": "Result Title"
    }
  ]
}
```

The service supports multiple response formats:
- `{ "results": [...] }` - Array of results
- `{ "data": [...] }` - Alternative format
- `{ "hits": [...] }` - Another alternative
- Direct array or object response

### Option 2: Quick Test with Mock Server

To test JARVIS without a real search service, you can run a simple mock server:

```javascript
// mock-search-server.js
const http = require('http');

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const query = url.searchParams.get('q') || 'test';
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    results: [
      {
        snippet: `Results for "${query}": This is a mock search result.`,
        url: "http://example.com/search?q=" + encodeURIComponent(query),
        source: "Mock Search Service",
        title: "Mock Result"
      }
    ]
  }));
});

server.listen(8081, () => {
  console.log('Mock search server running on http://localhost:8081/');
});
```

Run it with:
```bash
node mock-search-server.js
```

## Testing

After starting your search service on port 8081:

1. **Start JARVIS:**
   ```bash
   npm start
   ```

2. **Test a search query:**
   - In JARVIS, type: "what is new today"
   - Or: "search for python"
   - Or: "weather in London"

3. **Expected Response:**
   - JARVIS should send the query to http://localhost:8081/
   - Display the results in the chat
   - Speak the response aloud

## Error Handling

If the search service is not running:
- ✗ Error message: "Cannot reach the local search service at localhost:8081. Is the service running?"
- Response will fail gracefully without hanging

If the service is slow:
- ⏱️ 10 second timeout on requests
- If exceeded: "Network request timed out. The search service may be overloaded, Sir."

## Search Query Examples

All of these will now use localhost:8081:

```
"what is new today?"          → web_search("top news today")
"weather in Paris?"           → web_search("weather in Paris")
"search for machine learning" → web_search("machine learning")
"find python tutorials"       → web_search("python tutorials")
```

## Implementation Details

**File Modified:** `src/tools/webTools.ts`

**Key Changes:**
- Endpoint: `http://localhost:8081/?q={query}`
- Flexible response parsing (supports multiple JSON formats)
- 10-second timeout with proper error messages
- Graceful fallback for missing fields

**Response Mapping:**
```
Local API Field     →  JARVIS Display
snippet/description →  Main result text
url/link            →  Source URL
source/name         →  Source attribution
results/hits        →  Related topics
```

## Troubleshooting

### "Cannot reach the local search service"
1. Verify service is running on port 8081
   ```bash
   curl http://localhost:8081/?q=test
   ```
2. Check if port 8081 is in use
   ```bash
   netstat -ano | findstr :8081
   ```
3. Firewall might be blocking localhost connections
4. Restart JARVIS if service was just started

### Service returning errors
Ensure your API returns JSON in one of these formats:
- `{ "results": [...] }`
- `{ "data": [...] }`
- `{ "hits": [...] }`
- Direct array or object

### Searches are slow
- Check service performance: `time curl http://localhost:8081/?q=test`
- Verify service is using indexes/cache
- Check network latency with `ping localhost`

## Switching Back to DuckDuckGo

If you need to revert to DuckDuckGo, restore the original fetch URL:
```typescript
// In webSearchTool.execute()
const response = await fetch(
  `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
  { signal: controller.signal }
);
```

Then rebuild: `npm run build`

## Security Note

- Local search service has full access to your search queries
- No data is sent to external services
- Consider rate limiting in your search service
- Implement authentication if sharing the service
