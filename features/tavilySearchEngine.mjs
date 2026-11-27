import fetch from 'node-fetch';

const TAVILY_SEARCH_URL = 'https://api.tavily.com/search';
const LANGSEARCH_URL = 'https://api.langsearch.com/v1/web-search';

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
 * Query LangSearch Web Search REST API as secondary web fallback.
 * @param {string} query
 * @param {number} [count]
 * @returns {Promise<Array<{title: string, url: string, content: string}> | null>}
 */
export async function searchLangSearch(query, count = 3) {
  const apiKey = (process.env.LANGSEARCH_API_KEY || '').trim();
  const cleanQuery = (query || '').trim().slice(0, 400);
  if (!apiKey || !cleanQuery) return null;

  try {
    const res = await fetch(LANGSEARCH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: cleanQuery,
        freshness: 'noLimit',
        summary: true,
        count
      }),
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) return null;
    const json = await res.json();
    const pages = json?.data?.webPages?.value;
    if (!Array.isArray(pages) || pages.length === 0) return null;

    return pages.slice(0, count).map(p => ({
      title: (p.name || 'Source').trim(),
      url: p.url || '',
      content: (p.summary || p.snippet || '').trim()
    }));
  } catch (err) {
    console.warn('[LangSearch] Request notice:', err.message);
    return null;
  }
}

/**
 * Final rate-limit fallback for AI prompts: tries Tavily first, then LangSearch, and formats a clean Discord response.
 * @param {string} prompt
 * @returns {Promise<string | null>}
 */
export async function tavilyFallbackSearch(prompt) {
  const data = await searchTavily(prompt, { searchDepth: 'basic', maxResults: 3 });
  if (data) {
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
    const out = lines.join('\n').trim();
    if (out) return out;
  }

  // Secondary Web Fallback: LangSearch
  const langResults = await searchLangSearch(prompt, 3);
  if (!langResults || langResults.length === 0) return null;

  const summary = langResults[0].content ? langResults[0].content.slice(0, 650) : '';
  const sources = langResults
    .filter(r => r.url)
    .slice(0, 3)
    .map(r => `• [${(r.title || 'Source').slice(0, 60)}](<${r.url}>)`)
    .join('\n');

  return [summary, sources ? `\n**Sources (LangSearch Web Fallback):**\n${sources}` : '']
    .filter(Boolean)
    .join('\n')
    .trim() || null;
}
