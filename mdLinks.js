const funciones = require('./data.js');
const fs = require('fs');
const path = require('path');

// Función principal
const mdLinks = (path1, options) => {
  const absolutePath = path.resolve(path1);
  // console.log('😎 ruta absoluta:⭐ ' + absolutePath.yellow);

  if (!funciones.pathExists(absolutePath)) {
    return Promise.reject(new Error('La ruta no existe'));
  }

  const element = fs.statSync(absolutePath);

  if (element.isFile()) {
    // Lógica para archivos
    // console.info('👍 es archivo 😃'.blue);
    if (funciones.isMarkDown(absolutePath)) {
      // console.info('👍 es markdown 😉'.blue);
      return funciones.readMarkdownFile(absolutePath)
        .then((data) => funciones.extractMarkdownLinks(data, absolutePath, options.validate))
        .then((links) => {
          return links;
        })
        .catch((error) => {
          // console.error('Error al procesar el archivo:', error);
          return []; // Devuelve un arreglo vacío en caso de error
        });
    } else {
      // console.info('👎 no es markdown 😠'.red);
      return Promise.resolve([]); // Devuelve una promesa resuelta con un arreglo vacío si no es un archivo Markdown
    }
  } else if (element.isDirectory()) {
    // Lógica para directorios
    // console.info('👍 es directorio 😆'.gray);
    return funciones.readMarkdownDirectory(absolutePath)
      .then((data) => {
        const routePromises = data.map((fileObj) => {
          const filePath = path.join(absolutePath, fileObj.name);
          return mdLinks(filePath, options);
        });

        return Promise.all(routePromises)
          .then((results) => {
            const allLinks = results.flat(); // Aplanar el resultado de las llamadas recursivas

            if (options.stats) {
              const totalLinks = allLinks.length;
              const uniqueLinks = [...new Set(allLinks.map(link => link.href))].length;
              const brokenLinks = allLinks.filter(link => link.status !== 200).length;

              return {
                total: totalLinks,
                unique: uniqueLinks,
                broken: brokenLinks,
                links: allLinks
              };
            } else {
              return allLinks;
            }
          })
          .catch((error) => {
            console.error('Error al procesar el directorio:', error);
            return []; // Devuelve un arreglo vacío en caso de error
          });
      });
  }

  return Promise.resolve([]); // Devuelve un arreglo vacío si no es ni archivo ni directorio
};



module.exports = { mdLinks };