const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());
app.use(cors()); 

// URL validation helper
const isValidUrl = (string) => {
  try {
    const parsed = new URL(string);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

// Audit Endpoint
app.post('/api/audit', async (req, res) => {
  let { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required.' });
  }

  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

//For Vercel serverless functions
module.exports = app;

  // 1. Invalid URL handling
  if (!isValidUrl(url)) {
    return res.status(400).json({ error: 'Please enter a valid HTTP or HTTPS URL.' });
  }

  try {
    const startTime = Date.now();

    // 2. Fetch page with timeout and custom User-Agent
    const response = await axios.get(url, {
      timeout: 8000, // 8 seconds timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) URLAuditorBot/1.0',
      },
      validateStatus: () => true, 
    });

    const responseTime = Date.now() - startTime;
    const contentType = response.headers['content-type'] || '';

    // 3. Non-HTML Response Handling
    if (!contentType.includes('text/html')) {
      return res.status(400).json({
        error: `Target URL returned non-HTML content (${contentType.split(';')[0]}).`,
      });
    }

    // 4. Parse HTML using Cheerio
    const $ = cheerio.load(response.data);

    const title = $('title').first().text().trim() || 'No Title Found';
    const metaDescription =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      'No Meta Description Found';

    const h1Count = $('h1').length;

    // Images missing alt attribute or having empty alt
    const images = $('img');
    let imagesMissingAlt = 0;
    images.each((_, img) => {
      const alt = $(img).attr('alt');
      if (alt === undefined || alt.trim() === '') {
        imagesMissingAlt++;
      }
    });

    // Word Count Calculation
    $('script, style, noscript, svg').remove(); // Extra noise clean karein
    const textContent = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = textContent ? textContent.split(' ').length : 0;

    // Response send karein
    return res.json({
      url,
      status: response.status,
      responseTimeMs: responseTime,
      title,
      metaDescription,
      h1Count,
      imagesMissingAlt,
      totalImages: images.length,
      wordCount,
    });

  } catch (err) {
    // 5. Proper Failure Handling
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'Timeout: Website took too long to respond (Limit: 8s).' });
    }
    if (err.code === 'ENOTFOUND') {
      return res.status(404).json({ error: 'Domain not found. Check the URL spelling.' });
    }
    return res.status(500).json({ error: `Failed to audit URL: ${err.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

module.exports = app;