const funciones = require ('../data.js');
//const { mdLinks } = require('../mdLinks.js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

jest.mock('fs');
jest.mock('node-fetch');
const isValid = jest.fn();

describe('cuando la ruta existe', () => {
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

describe('leer archivos markdown', () => {
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

describe('isValid', () => {
  it('debería resolverse con datos cuando la respuesta sea correcta', () => {
    const mockData = true;
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

describe('extraer Markdown Enlaces', () => {
  // Después de cada prueba, limpiamos todas las simulaciones y seguimientos realizados 
  // en funciones simuladas utilizando Jest.
  afterEach(() => {
    jest.clearAllMocks();
  });
  // Creamos una variable llamada 'mockData' que contiene un fragmento de texto con enlaces 
  // simulados en formato Markdown.
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
          { href: 'https://www.example.com', text: 'Enlace 1', File: '/path/to/markdown/file', status: 200, ok: 'ok' },
          { href: 'https://www.example.org', text: 'Enlace 2', File: '/path/to/markdown/file', status: 200, ok: 'ok' },
        ]);
      });
  });

  it('debe extraer y devolver enlaces sin validación', async () => {
    const data = `
      [Link 1](https://example.com)
      [Link 2](https://example.org)
    `;

    isValid.mockImplementation(() => {
      throw new Error('isValid no debe ser llamado');
    });

    const result = await funciones.extractMarkdownLinks(data, '../readme.md', false);

    expect(result).toEqual([
      { href: 'https://example.com', text: 'Link 1', File: '../readme.md' },
      { href: 'https://example.org', text: 'Link 2', File: '../readme.md' },
    ]);

    // Verificar que isValid no fue llamado
    expect(isValid).not.toHaveBeenCalled();
  });

  it('no debe manejar enlaces', async () => {
    const data = 'Este es un texto plano sin enlaces.';

    const result = await funciones.extractMarkdownLinks(data, '../readme.md', true);

    expect(result).toEqual([]);

    // isValid no debe ser llamado
    expect(isValid).not.toHaveBeenCalled();
  });

  it('debe manejar múltiples enlaces en diferentes formatos', async () => {
    const data = `
      [Link 1](https://example.com)
      [Link 2](https://example.org)
      ![Image Link](https://image.com)
      [Markdown Link](https://markdown.org)
    `;

    isValid.mockResolvedValue(true);

    const result = await funciones.extractMarkdownLinks(data, '../readme.md', true);

    expect(result).toEqual([
      { href: 'https://example.com', text: 'Link 1', File: '../readme.md', status: 200, ok: 'ok' },
      { href: 'https://example.org', text: 'Link 2', File: '../readme.md', status: 200, ok: 'ok' },
      { href: 'https://image.com', text: 'Image Link', File: '../readme.md', status: 200, ok: 'ok' },
      { href: 'https://markdown.org', text: 'Markdown Link', File: '../readme.md', status: 200, ok: 'ok' },
    ]);
  });
  // Extrae enlaces de datos de markdown
  it('debe extraer enlaces cuando se proporcionen datos de markdown válidos', async () => {
    const data = '[Link 1](https://www.link1.com) [Link 2](https://www.link2.com)';
    const absolutePath = '/path/to/file.md';
    const validate = false;

    const expected = [
      { href: 'https://www.link1.com', text: 'Link 1', File: '/path/to/file.md' },
      { href: 'https://www.link2.com', text: 'Link 2', File: '/path/to/file.md' }
    ];

    await expect(funciones.extractMarkdownLinks(data, absolutePath, validate)).resolves.toEqual(expected);
  });
  // Devuelve una matriz de objetos de enlace
  it('debe devolver una serie de objetos de enlace cuando se proporcionan datos de markdown válidos', async () => {
    const data = '[Link 1](https://www.link1.com) [Link 2](https://www.link2.com)';
    const absolutePath = '/path/to/file.md';
    const validate = false;

    const expected = [
      { href: 'https://www.link1.com', text: 'Link 1', File: '/path/to/file.md' },
      { href: 'https://www.link2.com', text: 'Link 2', File: '/path/to/file.md' }
    ];

    await expect(funciones.extractMarkdownLinks(data, absolutePath, validate)).resolves.toEqual(expected);
  });
  // Resuelve promesas para todos los enlaces
  it('debería resolver las promesas para todos los enlaces cuando la validación sea verdadera', async () => {
    const data = '[Link 1](https://www.link1.com) [Link 2](https://www.link2.com)';
    const absolutePath = '/path/to/file.md';
    const validate = true;

    const expected = [
      { href: 'https://www.link1.com', text: 'Link 1', File: '/path/to/file.md', status: 200, ok: 'ok' },
      { href: 'https://www.link2.com', text: 'Link 2', File: '/path/to/file.md', status: 200, ok: 'ok' }
    ];

    const result = await funciones.extractMarkdownLinks(data, absolutePath, validate);
    expect(result).toEqual(expected);
  });
  // No se encontraron enlaces en los datos de markdown
  it('debería devolver una matriz vacía cuando no se encuentren enlaces en los datos de markdown', async () => {
    const data = 'Este es un texto sin ningún enlace.';
    const absolutePath = '/path/to/file.md';
    const validate = false;

    const expected = [];

    const result = await funciones.extractMarkdownLinks(data, absolutePath, validate);
    expect(result).toEqual(expected);
  });
  // datos de markdown no válidos
  it('debería devolver una matriz vacía cuando los datos de markdown no sean válidos', async () => {
    const data = 'Esta no es un markdawn válido.';
    const absolutePath = '/path/to/file.md';
    const validate = false;

    const expected = [];

    await expect(funciones.extractMarkdownLinks(data, absolutePath, validate)).resolves.toEqual(expected);
  });

});

describe('es MarkDown', () => {
  it('debería devolver verdadero para extensiones de archivo Markdown válidas', () => {
    expect(funciones.isMarkDown('../readme.md')).toBe(true);
    expect(funciones.isMarkDown('/ruta/a/archivo.mkd')).toBe(true);
    expect(funciones.isMarkDown('../readme.mdwn')).toBe(true);
    expect(funciones.isMarkDown('../readme.mdown')).toBe(true);
    expect(funciones.isMarkDown('../readme.mdtxt')).toBe(true);
    expect(funciones.isMarkDown('/ruta/a/archivo.markdown')).toBe(true);
    expect(funciones.isMarkDown('/ruta/a/archivo.text')).toBe(true);
  });

  it('debería devolver falso para extensiones de archivo no válidas', () => {
    expect(funciones.isMarkDown('/ruta/a/archivo.txt')).toBe(false);
    expect(funciones.isMarkDown('/ruta/a/archivo.js')).toBe(false);
    expect(funciones.isMarkDown('/ruta/a/archivo.html')).toBe(false);
    expect(funciones.isMarkDown('/ruta/a/archivo.css')).toBe(false);
  });

  it('no debe distinguir entre mayúsculas y minúsculas', () => {
    expect(funciones.isMarkDown('../readme.md')).toBe(true);
    expect(funciones.isMarkDown('/ruta/a/archivo.MkD')).toBe(true);
    expect(funciones.isMarkDown('../readme.mdTxt')).toBe(true);
  });
});

describe('leer Markdown Directory', () => {

  // Debería devolver una promesa que se resuelva en una matriz de objetos de archivo cuando se le proporcione una ruta absoluta válida
  it('debería devolver una promesa que se resuelva en una matriz de objetos de archivo cuando se le proporcione una ruta absoluta válida', () => {
    const absolutePath = '/path/to/directory';
    const fileObjs = [{ name: 'file1.md', isFile: true }, { name: 'file2.md', isFile: true }];
    jest.spyOn(fs, 'readdirSync').mockReturnValue(fileObjs);

    return funciones.readMarkdownDirectory(absolutePath).then((result) => {
      expect(result).toEqual(fileObjs);
      expect(fs.readdirSync).toHaveBeenCalledWith(absolutePath, { withFileTypes: true });
    });
  });
  // Debería devolver una matriz vacía cuando el directorio esté vacío
  it('debería devolver una matriz vacía cuando el directorio esté vacío', () => {
    const absolutePath = '/path/to/empty/directory';
    const fileObjs = [];
    jest.spyOn(fs, 'readdirSync').mockReturnValue(fileObjs);

    return funciones.readMarkdownDirectory(absolutePath).then((result) => {
      expect(result).toEqual(fileObjs);
      expect(fs.readdirSync).toHaveBeenCalledWith(absolutePath, { withFileTypes: true });
    });
  });

  // Debería devolver una matriz de objetos de archivo cuando el directorio contiene solo archivos markdown
  it('debería devolver una matriz de objetos de archivo cuando el directorio contiene solo archivos markdown', () => {
    const absolutePath = '/path/to/directory';
    const fileObjs = [{ name: 'file1.md', isFile: true }, { name: 'file2.md', isFile: true }];
    jest.spyOn(fs, 'readdirSync').mockReturnValue(fileObjs);

    return funciones.readMarkdownDirectory(absolutePath).then((result) => {
      expect(result).toEqual(fileObjs);
      expect(fs.readdirSync).toHaveBeenCalledWith(absolutePath, { withFileTypes: true });
    });
  });
  // Debería devolver la matriz de objetos de archivo cuando el directorio contiene archivos
  it('debería devolver la matriz de objetos de archivo cuando el directorio contiene archivos', () => {
    const absolutePath = '/path/to/directory';
    const fileObjs = [{ name: 'file1.txt', isFile: true }, { name: 'file2.txt', isFile: true }];
    jest.spyOn(fs, 'readdirSync').mockReturnValue(fileObjs);

    return funciones.readMarkdownDirectory(absolutePath).then((result) => {
      expect(result).toEqual(fileObjs);
      expect(fs.readdirSync).toHaveBeenCalledWith(absolutePath, { withFileTypes: true });
    });
  });

  // Debería devolver un error como promesa rechazada cuando se le proporciona una ruta absoluta no válida
  it('debería devolver un error como promesa rechazada cuando se le proporciona una ruta absoluta no válida', () => {
    const absolutePath = '/invalid/path';
    const error = new Error('Invalid path');
    jest.spyOn(fs, 'readdirSync').mockImplementation(() => {
      throw error;
    });

    return funciones.readMarkdownDirectory(absolutePath).catch((err) => {
      expect(err).toEqual(error);
      expect(fs.readdirSync).toHaveBeenCalledWith(absolutePath, { withFileTypes: true });
    });
  });
});

/* describe('mdLinks', () => {

  // Prueba que la función se resuelve con una matriz de objetos que contienen href, texto y propiedades de archivo cuando se le proporciona una ruta de archivo markdown válida con enlaces
  it('debe resolverse con una serie de objetos que contienen href, texto y propiedades de archivo cuando se le proporciona una ruta de archivo de rebajas válida con enlaces', () => {
    // Simula la función pathExists para devolver verdadero
    funciones.pathExists = jest.fn().mockReturnValue(true);

    // Simula la función isMarkDown para devolver verdadero
    funciones.isMarkDown = jest.fn().mockReturnValue(true);
    // Simula la función readMarkdownFile para devolver una promesa que se resuelve con datos markdown
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
        expect(error.message).toBe('La ruta no existe');
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
        expect(error.message).toBe('La ruta no existe');
      });
  });

  // Prueba que la función rechaza con un error cuando se le proporciona una ruta no válida
  it('debe rechazar con un error cuando se le proporciona una ruta no válida', () => {
    // Mock de la función pathExists para devolver falsa
    funciones.pathExists = jest.fn().mockReturnValue(false);

    // Llama a la función mdLinks con una ruta no válida
    return expect(mdLinks('invalid/path.md', false)).rejects.toThrow('La ruta no existe');
  });
  // Devuelve una matriz vacía para una ruta de archivo markdown
  it('debería devolver una matriz vacía cuando se le proporcione una ruta de archivo sin markdown', () => {
    const path = 'non/markdown/file.txt';
    const options = {};

    //Comprueba si el archivo existe antes de ejecutar la prueba
    if (fs.existsSync(path)) {
      return mdLinks(path, options)
        .then((result) => {
          expect(Array.isArray(result)).toBe(true);
          expect(result.length).toBe(0);
        });
    } else {
      // Si el archivo no existe, la prueba pasa
      return Promise.resolve();
    }
  });
}); */