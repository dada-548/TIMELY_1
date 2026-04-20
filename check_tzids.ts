import fs from 'fs';
const data = JSON.parse(fs.readFileSync('public/timezones.json', 'utf8'));
const objKey = Object.keys(data.objects)[0];
console.log('Sample properties:', data.objects[objKey].geometries[0].properties);
const ids = new Set();
data.objects[objKey].geometries.forEach(g => {
  if (g.properties && g.properties.tzid) {
    ids.add(g.properties.tzid);
  }
});
console.log(Array.from(ids).filter(id => id.includes('Greenland') || id.includes('America/') || id.includes('Atlantic/')).sort().join('\n'));
