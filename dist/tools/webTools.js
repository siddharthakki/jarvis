"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchWebPageTool = exports.webSearchTool = void 0;
const ToolRegistry_1 = require("./ToolRegistry");
// Using built-in fetch available in Node 18+ and Electron main process
/**
 * Web Search Tool - Allows JARVIS to access the internet
 */
const webSearchTool = {
    name: 'web_search',
    description: 'Search the internet for real-time information, news, or technical documentation',
    schema: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'The search query'
            }
        },
        required: ['query']
    },
    riskLevel: 'safe',
    mutatesWorkspace: false,
    requiresWorkspace: false,
    async execute(args, context) {
        const query = args.query;
        const status = context?.statusCallback;
        try {
            status?.(`Searching the web for: "${query}"...`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);
            status?.('Contacting SearXNG...');
            const response = await fetch(`http://localhost:8081/search?q=${encodeURIComponent(query)}&format=json`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`SearXNG error: ${response.status}`);
            }
            status?.('Processing search results...');
            const data = await response.json();
            const results = data.results ?? [];
            const first = results[0];
            status?.('Search complete.');
            return {
                success: true,
                data: {
                    results: results.map((r) => ({
                        title: r.title,
                        snippet: r.content || r.title,
                        url: r.url
                    })),
                    count: results.length,
                    source: first?.engine || 'SearXNG'
                }
            };
        }
        catch (error) {
            // Fallback to DuckDuckGo
            console.warn('SearXNG unavailable, using DuckDuckGo fallback');
            try {
                status?.('Falling back to DuckDuckGo...');
                const duckduckgoResponse = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                if (!duckduckgoResponse.ok) {
                    throw new Error(`DuckDuckGo error: ${duckduckgoResponse.status}`);
                }
                const html = await duckduckgoResponse.text();
                const regex = /<a class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
                const results = [];
                let match;
                while ((match = regex.exec(html)) !== null && results.length < 5) {
                    const url = match[1];
                    const title = match[2].replace(/<[^>]*>/g, '').trim();
                    if (url && title) {
                        results.push({
                            title,
                            url,
                            content: '' // Empty content as per SearXNG format
                        });
                    }
                }
                status?.('Search complete.');
                return {
                    success: true,
                    data: {
                        results: results.map((r) => ({
                            title: r.title,
                            snippet: r.content || r.title,
                            url: r.url
                        })),
                        count: results.length,
                        source: 'DuckDuckGo'
                    }
                };
            }
            catch (fallbackError) {
                const errorMsg = fallbackError instanceof Error
                    ? fallbackError.message.includes('abort')
                        ? 'Search service is taking too long to respond. The service may be processing a large query, Sir. Please try a more specific search.'
                        : fallbackError.message.includes('Failed to fetch') || fallbackError.message.includes('ERR_')
                            ? 'Cannot reach SearXNG at localhost:8081 or DuckDuckGo fallback.'
                            : fallbackError.message
                    : 'Failed to reach the search service';
                status?.(`Search failed: ${errorMsg}`);
                return {
                    success: false,
                    error: errorMsg
                };
            }
        }
    }
};
exports.webSearchTool = webSearchTool;
/**
 * URL Fetcher Tool - Allows JARVIS to read specific web pages
 */
const fetchWebPageTool = {
    name: 'fetch_web_page',
    description: 'Read the content of a specific website URL',
    schema: {
        type: 'object',
        properties: {
            url: {
                type: 'string',
                description: 'The full URL to read'
            }
        },
        required: ['url']
    },
    riskLevel: 'safe',
    mutatesWorkspace: false,
    requiresWorkspace: false,
    async execute(args, context) {
        const url = args.url;
        const status = context?.statusCallback;
        try {
            status?.(`Fetching page: ${url}`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 45000);
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            status?.('Reading page content...');
            const text = await response.text();
            const cleanText = text.replace(/<[^>]*>?/gm, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .substring(0, 5000);
            status?.('Page loaded successfully.');
            return {
                success: true,
                data: cleanText
            };
        }
        catch (error) {
            const errorMsg = error instanceof Error
                ? error.message.includes('abort')
                    ? 'Request timed out while fetching the web page.'
                    : error.message
                : 'Failed to fetch the requested site';
            status?.(`Page fetch failed: ${errorMsg}`);
            return {
                success: false,
                error: errorMsg
            };
        }
    }
};
exports.fetchWebPageTool = fetchWebPageTool;
// Register the tools
ToolRegistry_1.ToolRegistry.register(webSearchTool);
ToolRegistry_1.ToolRegistry.register(fetchWebPageTool);
