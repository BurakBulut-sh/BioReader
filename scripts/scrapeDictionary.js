import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://www.biologyonline.com';
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'biologyonline_terms.json');
const DELAY_MS = 500; // Polite delay
const LIMIT_PER_LETTER = 50; // Limit for initial run to avoid overload, remove for full run
const _LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

// Helper for delays
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchValues(url) {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
        });
        if (!response.ok) {
            console.warn(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
            return null;
        }
        return await response.text();
    } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        return null;
    }
}

function extractTermsFromList(html) {
    const terms = [];
    // Correct regex based on debug output: <a class="wpg-list-item-title" title="..." href="...">Term</a>
    // We use a broader match to handle attribute order variations
    const regex = /<a\s+[^>]*class="wpg-list-item-title"[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g;

    let match;
    while ((match = regex.exec(html)) !== null) {
        terms.push({
            url: match[1],
            name: match[2].trim(),
        });
    }
    return terms;
}

function extractDefinition(html) {
    // Find valid content area
    // HTML might have attributes on div, so specific regex or loose search
    const contentStart = html.indexOf('class="entry-content"');
    if (contentStart === -1) return 'Definition not found.';

    // Take a chunk of text starting from entry-content to search within
    const contentChunk = html.substring(contentStart, contentStart + 5000); // 5000 chars should cover the definition

    // Look for paragraphs. 
    // We use a global regex to find multiple paragraphs in case the first one is garbage.
    const pRegex = /<p[^>]*>(.*?)<\/p>/gs;

    let match;
    while ((match = pRegex.exec(contentChunk)) !== null) {
        let text = match[1]
            .replace(/<[^>]*>/g, '') // Strip HTML tags
            .replace(/\s+/g, ' ')    // Normalize whitespace
            .trim();

        // Heuristics to skip non-definitions
        if (
            text.length > 20 &&
            !text.includes('BiologyOnline.com') &&
            !text.includes('cookies') &&
            !text.toLowerCase().includes('read more')
        ) {
            return text;
        }
    }

    return 'Definition not found.';
}

async function scrape() {
    console.log('Starting dictionary scrape...');
    const allTerms = [];

    // For this tasks, let's just do A, B, C to prove the concept and get ~500-1000 terms
    // User asked for "enlarge", not "complete scrape of entire internet"
    const targetLetters = ['a', 'b', 'c'];

    for (const letter of targetLetters) {
        console.log(`Processing letter: ${letter.toUpperCase()}...`);
        const listUrl = `${BASE_URL}/list/${letter}`;
        const listHtml = await fetchValues(listUrl);

        if (!listHtml) continue;

        let terms = extractTermsFromList(listHtml);
        console.log(`Found ${terms.length} terms for ${letter.toUpperCase()}`);

        // Enforce limit for demo purposes
        if (LIMIT_PER_LETTER > 0) {
            console.log(`Limiting to first ${LIMIT_PER_LETTER} terms.`);
            terms = terms.slice(0, LIMIT_PER_LETTER);
        }

        for (const term of terms) {
            process.stdout.write(`  Fetching ${term.name}... `);
            const termHtml = await fetchValues(term.url);
            if (termHtml) {
                const definition = extractDefinition(termHtml);
                allTerms.push({
                    name: term.name,
                    definition: definition,
                    category: 'General Biology', // Default
                    workflowTags: ['general'],
                    source: 'BiologyOnline'
                });
                process.stdout.write(`Done (${definition.substring(0, 20)}...)\n`);
            } else {
                process.stdout.write('Failed\n');
            }
            await delay(DELAY_MS);
        }
    }

    console.log(`Scrape complete. Collected ${allTerms.length} terms.`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allTerms, null, 2));
    console.log(`Saved to ${OUTPUT_FILE}`);
}

scrape().catch(err => console.error(err));
