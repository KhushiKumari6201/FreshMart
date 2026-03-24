const https = require('https');
const queries = ['broccoli', 'cucumber', 'sourdough bread', 'croissant', 'bagel', 'coconut water', 'mixed nuts', 'popcorn', 'tomato'];
let count = 0;
const results = {};

queries.forEach(q => {
  https.get(`https://unsplash.com/napi/search/photos?query=${encodeURIComponent(q)}&per_page=1`, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        results[q] = JSON.parse(data).results[0].urls.raw + '&w=400&h=300&fit=crop&auto=format';
      } catch(e) {
        results[q] = 'ERROR';
      }
      count++;
      if(count === queries.length) {
        console.log(JSON.stringify(results, null, 2));
      }
    });
  });
});
