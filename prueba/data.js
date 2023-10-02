const fs = require('fs');// Módulo 'fs' para interactuar con el sistema de archivos.
const path = require('path'); // Módulo 'path' para manejar rutas de archivo y directorio.
const fetch = require('node-fetch');// Módulo 'node-fetch' para realizar solicitudes HTTP.
const colors = require('colors');

// Función para verificar si una ruta existe
const pathExists = (absolutePath) => {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(absolutePath)) {
      resolve(true);// Resuelve la promesa como verdadera si la ruta existe.
    } else {
      reject(false);// Rechaza la promesa como falsa si la ruta no existe.
    }
  });
};

// Función para leer el contenido de un archivo markdown como promesa
const readMarkdownFile = (absolutePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(absolutePath, 'utf-8', (err, data) => {
      if (data) {
        // console.log(data.magenta);
        // Resuelve la promesa con el contenido del archivo si se lee correctamente.
        resolve(data);
      } else {
        // Rechaza la promesa con un error si no hay datos o hay un error de lectura.
        reject(new Error('el archivo no contiene datos'));
        // Imprime un mensaje de error en la consola (en verde) si hay un error.
       // console.log('error: '.red, err);
      }
    });
  });
}

// Función para verificar si una URL es válida
const isValid = (filePath) => {
  // Realiza una solicitud HTTP a la URL especificada.
  return fetch(filePath)
    .then((response) => {
      if (response.ok) {
  // Devuelve `true` si la respuesta de la solicitud es satisfactoria (código de respuesta HTTP 200).
        return true;
      } else {
  // Devuelve `false` si la respuesta de la solicitud no es satisfactoria (código de respuesta HTTP diferente de 200).
        return false;
      }
    })
    .catch((error) => {
    // Captura cualquier error que ocurra durante la solicitud y lo devuelve
      return error;
    });
}

// Función para extraer y validar enlaces en archivo Markdown
const extractMarkdownLinks = (data, absolutePath, validate) => {
   // Expresión regular para buscar enlaces en formato Markdown
  const regex = /(?=\[(!\[.+?\]\(.+?\)|.+?)]\((https:\/\/[^\)]+)\))/gi;
  const matches = [...data.matchAll(regex)];
  const linkPromises = [];

  for (const m of matches) {
    const linkInfo = { href: m[2], text: m[1], File: absolutePath };
    if (validate) {
       // Validación activada: Se realiza una solicitud HTTP para validar el enlace
      const promise = isValid(m[2])
        .then((data) => {
          // La validación se realizó correctamente
          if (data) {
            linkInfo.status = 200;
            linkInfo.ok = 'ok';
          }else {
          // La solicitud HTTP tuvo éxito, pero el contenido no es válido
            linkInfo.status = 400;
            linkInfo.ok = 'fail';
          }
          return linkInfo; // Devolvemos linkInfo resuelto
        })
        .catch((error) => {
          // Ocurrió un error durante la validación
          linkInfo.status = 404;
          linkInfo.ok = 'fail';
          return linkInfo; // Devolvemos linkInfo con error
        });

      linkPromises.push(promise);
    } else {
      linkPromises.push(Promise.resolve(linkInfo));
    }
  }

  return Promise.all(linkPromises) // Espera a que todas las promesas se resuelvan
    .then((resolvedLinks) => {
      // resolvedLinks contiene todos los linkInfo resueltos
      return resolvedLinks;
    });
}

  // Función para verificar si un archivo tiene una extensión de Markdown
const isMarkDown = (absolutePath) => {
  // Lista de extensiones válidas para archivos Markdown
  const extensionesValidas = ['.md','.mkd','.mdwn','.mdown','.mdtxt','.markdown','.text'];
  // Obtiene la extensión del archivo y la convierte a minúsculas
  const extensionArchivo = path.extname(absolutePath).toLowerCase();
   // Comprueba si la extensión del archivo está en la lista de extensiones válidas
  return extensionesValidas.includes(extensionArchivo);
};

// Función para leer la lista de archivos en un directorio
const readMarkdownDirectory = (absolutePath) => {
  try{
    // Lee la lista de archivos en el directorio 'absolutePath' de manera síncrona y con información adicional (withFileTypes: true).
    const listaArchivos = fs.readdirSync(absolutePath, { withFileTypes: true});
     // Resuelve la promesa con la lista de archivos obtenida.
    return Promise.resolve(listaArchivos);
  } catch (error){
    // En caso de error al leer el directorio, rechaza la promesa con el error.
    return Promise.reject(error);
  }
};
module.exports = {pathExists, readMarkdownFile, readMarkdownDirectory, extractMarkdownLinks, isMarkDown, isValid };