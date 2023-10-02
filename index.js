#!/usr/bin/env node
// La línea anterior indica que este archivo es un script de Node.js y debe ejecutarse con Node.js.
const { mdLinks } = require('./mdLinks.js');
const path = require('path');
// Desestructura process.argv para obtener los argumentos, ignorando los dos primeros elementos.
const [, , ...args] = process.argv;
const path1 = args[0];
// La variable validate se establece en true si se incluye el argumento --validate.
const validate = args.includes('--validate');
const stats = args.includes('--stats');

// Comprueba si no se proporciona una ruta válida (path1) o si se proporcionan más de un argumento y ninguna de las banderas validate o stats están habilitadas.
if (!path1 || (args.length > 1 && !validate && !stats)) {
  console.error('Uso incorrecto. Debes proporcionar una ruta y, opcionalmente, las banderas --validate y/o --stats.'.magenta);
  process.exit(1);
}
// Invocación de la función mdLinks con la ruta resuelta y opciones de validate y stats
mdLinks(path1, { validate, stats }) // Pasar un objeto con las opciones
  .then((results) => { // Manejo de la promesa resuelta
    let total = 0;
    let unicos = 0;
    let rotos = 0;
    // Inicialización de un arreglo para almacenar los enlaces encontrados
    const links = [];
    // Comprobación de si existen resultados de enlaces carpetas y subcarpetas
    if (results.links) {
      // Iteración a través de los enlaces encontrados
      results.links.forEach((element) => {
        // Agregar el enlace al arreglo de enlaces
        links.push(element);
        total++;
        // Comprobar si se requiere validación y si el enlace está roto (código de estado diferente de 200)
        if (validate && element.status !== 200) {
          rotos++;// Incrementar el contador de enlaces rotos
        }
      });
      // Calcular la cantidad de enlaces únicos utilizando un conjunto y luego calculando su longitud
      unicos = [...new Set(links.map((link) => link.href))].length;
    } else if(results.length > 0) {// pasas directo un archivo
      results.forEach((element) => {
        links.push(element);
        total += 1;
        // Comprobar si se requiere validación y si el enlace está roto (código de estado diferente de 200)
        if (validate && element.status !== 200) {
          rotos++;// Incrementar el contador de enlaces rotos
        }
      });
    }
    // Comprobación de si se requiere estadísticas
    if (stats) {
      // Imprimir el total de enlaces
      console.log('Total de enlaces:'.magenta, total);
      // Imprimir el total de enlaces unicos
      console.log('Enlaces únicos:'.yellow, unicos);
      if (validate) {
        // Imprimir el total de enlaces rotos si se requiere validacion
        console.log('Enlaces rotos:'.red, rotos);
      }

    }

    // Comprobación de si se requiere validación
    if (validate && !stats) {
      if (links.length === 0) {
        // Imprimir los resultados completos si no hay enlaces encontrados
        console.log(results);//imprime un array vacio
      } else {
        links.forEach((link) => {
          if (link.links) {
            // Imprimir los enlaces validados si se requiere validación
            console.log(link.links);
          } else {
            // Imprimir los enlaces sin validación si se requiere validación
            console.log(link);
          }

        });
      }
    } else if (!stats) {
      // Imprimir los resultados completos si no se requieren estadísticas ni validación
      console.log(results);
    }
  })
  .catch((error) => {// Manejo de errores en caso de que la promesa se rechace
    // Imprimir el mensaje de error en la consola
    console.error(error.message);
  });