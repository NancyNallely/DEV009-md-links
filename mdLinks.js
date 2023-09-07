const funciones = require('./data.js');
const fs = require('fs');
const path = require('path');

// Función principal
const mdLinks = (path1, validate) => {
  return new Promise((resolve, reject) => {
    const absolutePath = path.resolve(path1);
    console.log('😎 ruta absoluta:⭐ ' + absolutePath.yellow);

    if (!funciones.pathExists(absolutePath)) {
      reject(new Error('la ruta no existe'));
    }

    const element = fs.statSync(absolutePath);

    if (element.isFile()) {
      console.info('👍 es archivo 😉'.blue);
      if (funciones.isMarkDown(absolutePath)) {
        funciones.readMarkdownFile(absolutePath)
          .then((data) => resolve(funciones.extractMarkdownLinks(data, absolutePath, validate)))
          .catch((error) => reject(error));
      } else {
        reject(new Error('el archivo no es markDown'));
      }
    } else if (element.isDirectory()) {
      // Lógica para directorios (si es necesario)
      console.info('es directorio'.gray);
      resolve([]);
    }
  });
};

module.exports = { mdLinks };