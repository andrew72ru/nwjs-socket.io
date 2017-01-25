let NwBuilder = require('nw-builder');
let nw = new NwBuilder({
  files: './**/**',
  platforms: ['osx64', 'win64'],
  flavor: 'normal'
});

nw.on('log',  console.log);

// Build returns a promise
nw.build().then(function () {
  console.log('all done!');
}).catch(function (error) {
  console.error(error);
});

