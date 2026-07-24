const cheerio = require('cheerio');

// Helper Function for parsing logic to test independently
function parseHtml(htmlContent) {
  const $ = cheerio.load(htmlContent);

  const title = $('title').first().text().trim() || 'No Title Found';
  const metaDescription =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    'No Meta Description Found';

  const h1Count = $('h1').length;

  const images = $('img');
  let imagesMissingAlt = 0;
  images.each((_, img) => {
    const alt = $(img).attr('alt');
    if (alt === undefined || alt.trim() === '') {
      imagesMissingAlt++;
    }
  });

  $('script, style, noscript, svg').remove();
  const textContent = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = textContent ? textContent.split(' ').length : 0;

  return { title, metaDescription, h1Count, imagesMissingAlt, wordCount };
}

describe('HTML Parsing Logic Tests', () => {
  // Test 1: Happy Path
  test('Happy Path: Correctly parses fully structured HTML', () => {
    const sampleHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Page Title</title>
          <meta name="description" content="This is a test meta description." />
        </head>
        <body>
          <h1>Main Heading</h1>
          <p>Hello world, this is a test page with six words.</p>
          <img src="test1.jpg" alt="A valid image" />
          <img src="test2.jpg" />
        </body>
      </html>
    `;

    const result = parseHtml(sampleHtml);

    expect(result.title).toBe('Test Page Title');
    expect(result.metaDescription).toBe('This is a test meta description.');
    expect(result.h1Count).toBe(1);
    expect(result.imagesMissingAlt).toBe(1); // 1 out of 2 is missing alt
    expect(result.wordCount).toBeGreaterThan(0);
  });

  // Test 2: Failure Case 1 - Empty/Missing HTML tags
  test('Failure Case 1: Gracefully handles missing tags and empty body', () => {
    const emptyHtml = `<html><head></head><body></body></html>`;

    const result = parseHtml(emptyHtml);

    expect(result.title).toBe('No Title Found');
    expect(result.metaDescription).toBe('No Meta Description Found');
    expect(result.h1Count).toBe(0);
    expect(result.imagesMissingAlt).toBe(0);
    expect(result.wordCount).toBe(0);
  });

  // Test 3: Failure Case 2 - Malformed HTML & Noise elements
  test('Failure Case 2: Ignores script/style tags in word count and handles malformed HTML', () => {
    const noisyHtml = `
      <div>
        <script>const x = "THIS SHOULD NOT BE COUNTED AS WORDS";</script>
        <style>body { color: red; }</style>
        <h1>First Title</h1>
        <h1>Second Title</h1>
        <p>Real Content Here</p>
        <img src="test.jpg" alt="" />
      </div>
    `;

    const result = parseHtml(noisyHtml);

    expect(result.h1Count).toBe(2);
    expect(result.imagesMissingAlt).toBe(1); // Empty string alt counts as missing
    expect(result.wordCount).toBe(7); // "First Title Second Title Real Content Here"
  });
});