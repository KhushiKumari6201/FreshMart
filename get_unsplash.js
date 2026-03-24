const https = require('https');
const queries = ['Greek yogurt', 'Popcorn', 'Coconut water', 'Dark chocolate', 'Cucumber'];
let count = 0;
const results = {};

queries.forEach(q => {
  https.get(`https://unsplash.com/s/photos/${encodeURIComponent(q.replace(' ', '-'))}`, res => {
    let raw = '';
    res.on('data', c => raw += c);
    res.on('end', () => {
      const matches = raw.match(/photo-\d{13}-[a-f0-9]{12}/gi);
      if (matches && matches.length > 0) {
        results[q] = [...new Set(matches)].slice(0, 3).map(id => `https://images.unsplash.com/${id}?w=400&h=300&fit=crop`);
      } else {
        results[q] = 'FAIL';
      }
      count++;
      if(count === queries.length) console.log(JSON.stringify(results, null, 2));
    });
  });
});
