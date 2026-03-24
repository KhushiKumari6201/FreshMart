const https = require('https');
const queries = ['Honey', 'Peanut butter', 'Popcorn', 'Soy sauce', 'Black turtle bean'];
let count = 0;
const results = {};

queries.forEach(q => {
  const options = {
    hostname: 'en.wikipedia.org',
    path: `/w/api.php?action=query&titles=${encodeURIComponent(q)}&prop=pageimages&format=json&pithumbsize=400`,
    headers: { 'User-Agent': 'NodeApp/1.0' }
  };
  https.get(options, res => {
    let raw = '';
    res.on('data', c => raw += c);
    res.on('end', () => {
      try {
        const pages = JSON.parse(raw).query.pages;
        const page = pages[Object.keys(pages)[0]];
        results[q] = page.thumbnail.source;
      } catch(e) { results[q] = 'ERROR'; }
      count++;
      if(count === queries.length) console.log(JSON.stringify(results, null, 2));
    });
  });
});
