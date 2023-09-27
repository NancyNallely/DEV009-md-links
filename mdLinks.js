// Importa un módulo llamado 'data.js' y lo asigna a la variable 'funciones'.
const funciones = require('./data.js');
// Importa el módulo 'fs' (File System) de Node.js para trabajar con el sistema de archivos
const fs = require('fs');
// Importa el módulo 'path' de Node.js para trabajar con rutas de archivos y directorios.
const path = require('path');

// Función principal
const mdLinks = (path1, options) => {
  // Resuelve la ruta absoluta a partir de la ruta proporcionada
  const absolutePath = path.resolve(path1);
  //console.log('😎 ruta absoluta:⭐ ' + absolutePath.magenta);

  if (!funciones.pathExists(absolutePath)) {
    // Rechaza la promesa si la ruta no existe
    return Promise.reject(new Error('La ruta no existe'));
  }
 // Obtiene información sobre el elemento en la ruta (archivo o directorio)
  const element = fs.statSync(absolutePath);

  if (element.isFile()) {
   // console.info('👍 es archivo 😃'.blue);
    if (funciones.isMarkDown(absolutePath)) {
      //console.info('👍 es markdown 😉'.yellow);
      // Lee el contenido del archivo Markdown
      return funciones.readMarkdownFile(absolutePath)
        .then((data) => funciones.extractMarkdownLinks(data, absolutePath, options.validate))
        .then((links) => {
          return links;
        })
        .catch((error) => {
          // console.error('Error al procesar el archivo:', error);
          return ['Error, el archivo no es markdown']; // Devuelve un arreglo vacío en caso de error
        });
    } else {
      //console.info('👎 no es markdown 😠'.red);
      // Devuelve una promesa resuelta con un arreglo vacío si no es un archivo Markdown
      return Promise.resolve([]); 
    }
  } else if (element.isDirectory()) {
    //console.info('👍 es directorio 😆'.gray);
    // Lee la lista de archivos en el directorio y procesa cada uno de forma recursiva
    return funciones.readMarkdownDirectory(absolutePath)
      .then((data) => {
         // Crea un arreglo de promesas para procesar cada archivo en el directorio
        const routePromises = data.map((fileObj) => {
          const filePath = path.join(absolutePath, fileObj.name);
          return mdLinks(filePath, options);
        });
 
         // Espera a que todas las promesas se resuelvan 
        return Promise.all(routePromises)
          .then((results) => {
            const allLinks = results.flat(); // Aplanar el resultado de las llamadas recursivas

            if (options.stats) {
               // Calcular estadísticas si la opción 'stats' está habilitada
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


// Exporta la función 'mdLinks' para que esté disponible para otros módulos
module.exports = { mdLinks };