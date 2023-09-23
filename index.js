#!/usr/bin/env node
const { mdLinks } = require('./mdLinks.js');
const path = require('path');
const [, , ...args] = process.argv;
const path1 = args[0];
const validate = args.includes('--validate');
const stats = args.includes('--stats');

mdLinks(path.resolve(path1), { validate, stats }) // Pasar un objeto con las opciones
  .then((results) => {
    let total = 0;
    let unique = 0;
    let broken = 0;
    const links = [];

    if (results.links) {
      results.links.forEach((element) => {
        links.push(element);
        total++;
        if (validate && element.status !== 200){
          broken++;
        }
      });
      unique = [...new Set(links.map((link) => link.href))].length;
    }

    if (stats) {
      console.log('Total de enlaces:', total);
      console.log('Enlaces únicos:', unique);
      if (stats){
        console.log('Enlaces rotos:', broken);
      }
     
    }

    if (validate) {
      if (links.length === 0) {
        console.log(results);
      } else {
        links.forEach((link) => {
          if (link.links) {
            console.log(link.links);
          } else {
            console.log(link);
          }

        });
      }
    } else if (!stats) {
      console.log(results);
    }
  })
  .catch((error) => {
    console.error(error.message);
  });