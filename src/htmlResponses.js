const fs = require('fs');
const dataHandler = require('./dataResponses.js');

const index = fs.readFileSync(`${__dirname}/../client/client.html`);
const css = fs.readFileSync(`${__dirname}/../client/style.css`);
const clientJS = fs.readFileSync(`${__dirname}/../client/client.js`);
const pageNotFoundHTML = fs.readFileSync(`${__dirname}/../client/pageNotFound.html`);
const documentation = fs.readFileSync(`${__dirname}/../client/documentation.html`);
const docuCss = fs.readFileSync(`${__dirname}/../client/documentationStyle.css`);

// gets the index page
const getIndex = (request, response) => {
  dataHandler.respond(request, response, 200, index, 'text/html');
};
module.exports.getIndex = getIndex;

// gets the documentation page
const documentationPage = (request, response) => {
  dataHandler.respond(request, response, 200, documentation, 'text/html');
};
module.exports.documentationPage = documentationPage;

// function to get normal css page
const getCSS = (request, response) => {
  dataHandler.respond(request, response, 200, css, 'text/css');
};
module.exports.getCSS = getCSS;

// function to get documentationCSS
const getDocumentationCSS = (request, response) => {
  dataHandler.respond(request, response, 200, docuCss, 'text/css');
};
module.exports.getDocumentationCSS = getDocumentationCSS;

// gets the client code
const getClientCode = (request, response) => {
  dataHandler.respond(request, response, 200, clientJS, 'text/javascript');
};
module.exports.getClientCode = getClientCode;

// gets the 404 page
const pageNotFound = (request, response) => {
  const responseJSON = {
    message: 'Page not Found!',
    id: 'Page Not Found',
  };

  if (request.acceptedTypes[0] === 'text/html') {
    return dataHandler.respond(request, response, 404, pageNotFoundHTML, 'text/html');
  }

  return dataHandler.respond(request, response, 404, responseJSON, 'application/json');
};
module.exports.pageNotFound = pageNotFound;
