const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const colors = require('colors');

// Función para verificar si una ruta existe
const pathExists = (absolutePath) => {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(absolutePath)) {
      resolve(true);
    } else {
      resolve(false);
    }
  });
};

// Función para leer el contenido de un archivo como promesa
const readMarkdownFile = (absolutePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(absolutePath, 'utf-8', (err, data) => {
      if (data) {
        // console.log(data.magenta);
        resolve(data);
      } else {
        reject(new Error('el archivo no contiene datos'));
        console.log('error: ', err.green);
      }
    });
  });
}

// Función para validar un archivo markdown como promesa
const isValid = (filePath) => {
  return fetch(filePath)
    .then((response) => {
      if (response.ok) {
        return true;
      } else {
        return false;
      }
    })
    .catch((error) => {
      return error;
    });
}

// Función para extraer los enlaces de un archivo markdown
const extractMarkdownLinks = (data, absolutePath, validate) => {
  const regex = /(?=\[(!\[.+?\]\(.+?\)|.+?)]\((https:\/\/[^\)]+)\))/gi;
  const matches = [...data.matchAll(regex)];
  const linkPromises = [];

  for (const m of matches) {
    const linkInfo = { href: m[2], text: m[1], File: absolutePath };
    if (validate) {
      const promise = isValid(m[2])
        .then((data) => {
          // La validación se realizó correctamente
          // `data` contiene la respuesta JSON del archivo
          if (data) {
            linkInfo.status = 200;
            linkInfo.ok = 'ok';
          }else {
            linkInfo.status = 400;
            linkInfo.ok = 'fail';
          }
          return linkInfo; // Devolvemos linkInfo resuelto
        })
        .catch((error) => {
          // Ocurrió un error durante la validación
          linkInfo.status = 400;
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
  // validar si el archivo en markdown
const isMarkDown = (absolutePath) => {
  const extensionesValidas = ['.md','.mkd','.mdwn','.mdown','.mdtxt','.markdown','.text'];
  const extensionArchivo = path.extname(absolutePath).toLowerCase();
  return extensionesValidas.includes(extensionArchivo);
};

// funcion para leer el contenido de un directorio como promesa
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