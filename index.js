#!/usr/bin/env node
// "shebang" o "hashbang", y su propósito principal es indicar al sistema operativo cómo debe ejecutar el archivo.
//Indica que el script debe ejecutarse utilizando Node.js
// Importación del módulo 'mdLinks' desde el archivo './mdLinks.js'
const { mdLinks } = require('./mdLinks.js');
/* hito 4 */
// Importación del módulo 'path' de Node.js para trabajar con rutas de archivos
const path = require('path');
// Obtención de los argumentos pasados al script desde la línea de comandos
const [, , ...args] = process.argv;
// Extracción del primer argumento, que se espera que sea una ruta de archivo o directorio
const path1 = args[0];
// Verificación si la opción '--validate' está presente en los argumentos
const validate = args.includes('--validate');
/* hito 4 */
// Llamada a la función 'mdLinks' con la ruta absoluta de 'path1' y la opción de validación 'validate'
mdLinks(path.resolve(path1), validate)
  .then((links) => {
    // Manejo de la resolución exitosa de la promesa: impresión de los enlaces
    console.log(links);
  })
  .catch((error) => {
    // Manejo de cualquier error que pueda ocurrir durante la ejecución
    console.error(error.message);
  });