const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../public/_redirects');
const dest = path.join(__dirname, '../build/client/_redirects');
 
fs.copyFileSync(src, dest);
console.log(`Copied _redirects from ${src} to ${dest}`); 