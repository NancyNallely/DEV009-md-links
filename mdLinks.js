const funciones = require('./data.js');
const fs = require('fs');
const path = require('path');

// Función principal
const mdLinks = (path1, validate) => {
  const absolutePath = path.resolve(path1);
  console.log('😎 ruta absoluta:⭐ ' + absolutePath.yellow);

  if (!funciones.pathExists(absolutePath)) {
    reject(new Error('la ruta no existe'));
  }

  const element = fs.statSync(absolutePath);

  if (element.isFile()) {
    console.info('👍 es archivo 😉'.blue);
    if (funciones.isMarkDown(absolutePath)) {
      console.log('es markdown'.magenta);
      return funciones.readMarkdownFile(absolutePath)
        .then((data) => funciones.extractMarkdownLinks(data, absolutePath, validate))
        .catch((error) => {
          console.error('error al procesar el archivo' , error);
          return[]; // devuelve un arreglo vacio en caso de error
        });
    } else {
      console.log('el archivo no es markDown'.red);
      return[];
    }
     // Lógica para directorios (si es necesario)
    // Esta parte del código se ejecuta si el 'element' es un directorio.
  } else if (element.isDirectory()) {
     // Imprime un mensaje en la consola para indicar que se trata de un directorio.
    console.info('es directorio'.gray);
  // Llama a la función 'funciones.readMarkdownDirectory(absolutePath)' para leer el contenido del directorio 'absolutePath'.
    return funciones.readMarkdownDirectory(absolutePath)
      .then((data) => {
         // 'data' contiene la información de los archivos en el directorio.
           // Crea un array de promesas 'linksPromesas' que representa la búsqueda de enlaces en cada archivo.
        const linksPromesas = data.map((archivo) => { 
           // Construye la ruta completa al archivo dentro del directorio.
          const rutaArchivo = path.join(absolutePath, archivo.name);
          // Llama a la función 'mdLinks()' en el archivo para buscar enlaces, con opción de validación ('validate').
          return mdLinks(rutaArchivo, validate);
        });
         // Espera a que todas las promesas en 'linksPromesas' se resuelvan.
        return Promise.all(linksPromesas).then((resultados) => {
        // Usa 'flat()' para aplanar el array de arrays en un solo array de enlaces y devuelve ese resultado.
          return resultados.flat();
        })
        .catch((error) => {
          console.error('error al procesar el directorio:' , error);
          return[];
        });
      });
  }
};

module.exports = { mdLinks };