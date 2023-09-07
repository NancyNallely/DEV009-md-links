const { mdLinks } = require('./mdLinks.js');
mdLinks('./README.md', true)
.then((result) => {
    console.info(result);
})
.catch((error) => {
    console.error(error)
});

