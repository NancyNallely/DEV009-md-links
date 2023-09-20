const funciones = require('../data.js');
const { mdLinks } = require('../mdLinks.js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

jest.mock('fs');
jest.mock('node-fetch');

describe('test para probar la funcion pathExists', () => {
  it('debería resolverse a verdadero cuando exista la ruta', () => {
    fs.existsSync.mockReturnValue(true);
    return funciones.pathExists('/path/to/existing/file')
      .then((result) => {
        expect(result).toBe(true);
      });
  });

  it('debería resolverse en falso cuando la ruta no existe', () => {
    fs.existsSync.mockReturnValue(false);
    return funciones.pathExists('/path/to/nonexistent/file')
      .then((result) => {
        expect(result).toBe(false);
      });
  });
});

describe('test para probar la funcion readMarkdownFile', () => {
  it('debería resolverse con datos cuando el archivo se lea correctamente', () => {
    const mockData = 'Contenido del archivo Markdown';
    fs.readFile.mockImplementation((path, encoding, callback) => {
      callback(null, mockData);
    });

    return funciones.readMarkdownFile('/path/to/markdown/file')
      .then((data) => {
        expect(data).toBe(mockData);
      });
  });

  it('debería rechazar con un error cuando falla la lectura del archivo', () => {
    const mockError = new Error('Error al leer el archivo');
    fs.readFile.mockImplementation((path, encoding, callback) => {
      callback(mockError, null);
    });

    return funciones.readMarkdownFile('/path/to/invalid/file')
      .catch((error) => {
        expect(error.message).toBe('el archivo no contiene datos');
        // También puedes realizar más comprobaciones aquí si es necesario
      });
  });
});

describe('test para probar la funcion isValid', () => {
  it('debería resolverse con datos cuando la respuesta sea correcta', () => {
    const mockData = { valid: true };
    const mockResponse = { ok: true, json: () => Promise.resolve(mockData) };
    fetch.mockResolvedValue(mockResponse);

    return funciones.isValid('/path/to/valid/file')
      .then((data) => {
        expect(data).toEqual(mockData);
      });
  });

  it('debe rechazar con un error cuando la respuesta no es correcta', () => {
    const mockResponse = { ok: false };
    fetch.mockResolvedValue(mockResponse);

    return funciones.isValid('/path/to/invalid/file')
      .catch((error) => {
        expect(error.message).toBe('No se pudo validar el archivo');
        // También puedes realizar más comprobaciones aquí si es necesario
      });
  });

  it('debería manejar los errores de recuperación', () => {
    const mockFetchError = new Error('Error al realizar la solicitud');
    fetch.mockRejectedValue(mockFetchError);

    return funciones.isValid('/path/to/error/file')
      .catch((error) => {
        expect(error.message).toBe('Error al realizar la solicitud');
        // También puedes realizar más comprobaciones aquí si es necesario
      });
  });
});

describe('test para probar la funcion extractMarkdownLinks', () => {
  const mockData = `
    [Enlace 1](https://www.example.com)
    [Enlace 2](https://www.example.org)
  `;

  it('debe extraer y validar enlaces cuando la validación está habilitada', () => {
    const isValid = jest.fn((url) => {
      if (url === 'https://www.example.com') {
        return Promise.resolve({ valid: true });
      } else {
        return Promise.reject(new Error('Validation error'));
      }
    });

    return funciones.extractMarkdownLinks(mockData, '/path/to/markdown/file', true, isValid)
      .then((links) => {
        expect(links).toEqual([
          { href: 'https://www.example.com', text: 'Enlace 1', File: '/path/to/markdown/file', status: 200, ok: 'Ok' },
          { href: 'https://www.example.org', text: 'Enlace 2', File: '/path/to/markdown/file', status: 200, ok: 'Ok' },
        ]);
      });
  });
});

describe('test para probar la funcion isMarkDown', () => {
  it('debería resolverse en verdadero para las extensiones de archivo Markdown', () => {
    const extensions = ['.md', '.mkd', '.mdwn', '.mdown', '.mdtxt', '.markdown', '.text'];

    const promises = extensions.map((ext) => {
      const absolutePath = `/path/to/file${ext}`;
      return funciones.isMarkDown(absolutePath)
        .then((result) => {
          expect(result).toBe(true);
        });
    });

    return Promise.all(promises);
  });

  it('debería resolverse en falso para extensiones de archivo que no sean Markdown', () => {
    const extensions = ['.html', '.js', '.css', '.txt', '.json'];

    const promises = extensions.map((ext) => {
      const absolutePath = `/path/to/file${ext}`;
      return funciones.isMarkDown(absolutePath)
        .then((result) => {
          expect(result).toBe(false);
        });
    });

    return Promise.all(promises);
  });
});

describe('test para probar la funcion mdLinks', () => {
  it('debería rechazar con un error cuando la ruta de entrada no existe', () => {
    fs.statSync.mockImplementation(() => {
      throw new Error('la ruta no existe');
    });

    return mdLinks('/nonexistent/path', false)
      .catch((error) => {
        expect(error.message).toBe('la ruta no existe');
      });
  });

  
   // Prueba que la función se resuelve con una matriz de objetos que contienen href, texto y propiedades de archivo cuando se le proporciona una ruta de archivo markdown válida con enlaces
  it('debe resolverse con una serie de objetos que contienen href, texto y propiedades de archivo cuando se le proporciona una ruta de archivo markdown válida con enlaces', () => {
    // Simula la función pathExists para devolver verdadero
    funciones.pathExists = jest.fn().mockReturnValue(true);

    
    // Simula la función isMarkDown para devolver verdadero
    funciones.isMarkDown = jest.fn().mockReturnValue(true);

    // Simula la función readMarkdownFile para devolver una promesa que se resuelve con datos de markdown
    funciones.readMarkdownFile = jest.fn().mockResolvedValue('markdown data');

   // Simula la función extractMarkdownLinks para devolver una matriz de objetos
    funciones.extractMarkdownLinks = jest.fn().mockReturnValue([{ href: 'link', text: 'link text', file: 'file path' }]);

    
   // Simula la función statSync para devolver un objeto que indica que el archivo existe y es un archivo
    fs.statSync = jest.fn().mockReturnValue({ isFile: () => true });

   // Llame a la función mdLinks con una ruta de archivo markdown válida
    return mdLinks('valid/path.md', false)
      .then((result) => {
      //Esperamos que el resultado sea una matriz
        expect(Array.isArray(result)).toBe(true);

        
    // Se espera que el resultado contenga un objeto con propiedades href, texto y archivo
        expect(result[0]).toEqual({ href: 'link', text: 'link text', file: 'file path' });
      });
  });
    // Prueba que la función rechaza con un error cuando se le proporciona una ruta no válida
  it('debe rechazar con un error cuando se le proporciona una ruta no válida', () => {
    // Mock de la función pathExists para devolver falsa
    funciones.pathExists = jest.fn().mockReturnValue(false);
   // Llama a la función mdLinks con una ruta no válida
    return mdLinks('invalid/path.md', false)
      .catch((error) => {
        // Espera que el error sea una instancia de Error
        expect(error).toBeInstanceOf(Error);

        //Esperamos que el mensaje de error sea 'la ruta no existe'
        expect(error.message).toBe('la ruta no existe');
      });
  });
  
    // Prueba que la función rechaza con un error cuando se le da una ruta a un archivo no existente
  it('debería rechazar con un error cuando se le proporcione una ruta a un archivo no existente', () => {
    // Mock de la función pathExists para devolver falsa
    funciones.pathExists = jest.fn().mockReturnValue(false);

    // Llama a la función mdLinks con una ruta a un archivo no existente
    return mdLinks('non-existing/file.md', false)
      .catch((error) => {
        // Espera que el error sea una instancia de Error
        expect(error).toBeInstanceOf(Error);

       //Esperamos que el mensaje de error sea 'la ruta no existe'
        expect(error.message).toBe('la ruta no existe');
      });
  });
  
// Prueba que la función rechaza con un error cuando se le proporciona una ruta no válida
  it('debe rechazar con un error cuando se le proporciona una ruta no válida', () => {
    // Mock de la función pathExists para devolver falsa
    funciones.pathExists = jest.fn().mockReturnValue(false);

   // Llama a la función mdLinks con una ruta no válida
    return expect(mdLinks('invalid/path.md', false)).rejects.toThrow('la ruta no existe');
  });
  
// Prueba que la función rechaza con un error cuando se le proporciona una ruta a un archivo que no es markdown
  it('debería rechazar con un error cuando se le proporcione una ruta a un archivo que no sea markdown', () => {
    // Mock de la función pathExists para devolver verdadero
    funciones.pathExists = jest.fn().mockReturnValue(true);

    // Mock de la función isMarkDown para devolver falsa
    funciones.isMarkDown = jest.fn().mockReturnValue(false);

    // Mock de la función fs.statSync para devolver un objeto con el método 'isFile' que devuelve verdadero
    fs.statSync = jest.fn().mockReturnValue({ isFile: () => true });

   // Llame a la función mdLinks con una ruta a un archivo sin markdown
    return expect(mdLinks('non-markdown/file.txt', false)).rejects.toThrow('el archivo no es markDown');
  });
});

