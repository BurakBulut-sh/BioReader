const BASE_URL = 'https://www.biologyonline.com/dictionary/a-band';

async function debugFetch() {
    console.log('Fetching Definition Page...');
    const response = await fetch(BASE_URL, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
    });
    const html = await response.text();

    const contentRegex = /class="entry-content"[^>]*>(.*?)<!--/s;
    const match = contentRegex.exec(html);

    if (match) {
        console.log('Found entry-content!');
        const content = match[1];
        // naive strip tags
        const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        console.log('--- Extracted Text ---');
        console.log(text.substring(0, 1000));
        console.log('--- End Text ---');
    } else {
        console.log('Could not find entry-content via regex');
        // Try simple string search
        const start = html.indexOf('class="entry-content"');
        if (start !== -1) {
            console.log('Found string class="entry-content" at', start);
            console.log(html.substring(start, start + 1000));
        }
    }
}

debugFetch();
