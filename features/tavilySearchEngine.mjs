import fetch from 'node-fetch';

const TAVILY_SEARCH_URL = 'https://api.tavily.com/search';

/**
 * Query Tavily Search REST API for live web answers & sources.
 * @param {string} query
 * @param {object} [opts]
 * @returns {Promise<{answer: string, results: Array<{title: string, url: string, content: string}>} | null>}
 */
export async function searchTavily(query, opts = {}) {
  const apiKey = (process.env.TAVILY_API_KEY || '').trim();
  const cleanQuery = (query || '').trim().slice(0, 400);
  if (!apiKey || !cleanQuery) return null;

  try {
    const res = await fetch(TAVILY_SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: cleanQuery,
        search_depth: opts.searchDepth || 'basic',
        include_answer: true,
        max_results: opts.maxResults || 3
      }),
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!data || (!data.answer && (!Array.isArray(data.results) || data.results.length === 0))) {
      return null;
    }
    return {
      answer: (data.answer || '').trim(),
      results: Array.isArray(data.results) ? data.results.slice(0, opts.maxResults || 3) : []
    };
  } catch (err) {
    console.warn('[TavilySearch] Request notice:', err.message);
    return null;
  }
}

/**
 * Final rate-limit fallback for AI prompts: searches Tavily and formats a clean Discord response.
 * @param {string} prompt
 * @returns {Promise<string | null>}
 */
export async function tavilyFallbackSearch(prompt) {
  const data = await searchTavily(prompt, { searchDepth: 'basic', maxResults: 3 });
  if (!data) return null;

  const lines = [];
  if (data.answer) {
    lines.push(data.answer);
  } else if (data.results[0]?.content) {
    lines.push(data.results[0].content.slice(0, 600));
  }

  if (data.results.length > 0) {
    const sources = data.results
      .filter(r => r.url)
      .slice(0, 3)
      .map(r => `• [${(r.title || 'Source').slice(0, 60)}](<${r.url}>)`)
      .join('\n');
    if (sources) {
      lines.push(`\n**Sources (Tavily Web Fallback):**\n${sources}`);
    }
  }

  return lines.join('\n').trim() || null;
}
