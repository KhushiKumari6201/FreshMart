const https = require('https');
const queries = ['Strained yogurt', 'Kettle corn', 'Coconut milk', 'Chocolate bar', 'Cucumber'];
let count = 0;
const results = {};

queries.forEach(q => {
  const options = {
    hostname: 'en.wikipedia.org',
    path: `/w/api.php?action=query&titles=${encodeURIComponent(q)}&prop=pageimages&format=json&pithumbsize=500`,
    headers: { 'User-Agent': 'Mozilla/5.0' }
  };
  https.get(options, res => {
    let raw = '';
    res.on('data', c => raw += c);
    res.on('end', () => {
      try {
        const pages = JSON.parse(raw).query.pages;
        results[q] = pages[Object.keys(pages)[0]].thumbnail.source;
      } catch(e) { results[q] = 'ERROR'; }
      count++;
      if(count === queries.length) console.log(JSON.stringify(results, null, 2));
    });
  });
});
