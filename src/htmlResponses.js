const fs = require('fs');
const dataHandler = require('./dataResponses.js');

const index = fs.readFileSync(`${__dirname}/../client/client.html`);
const css = fs.readFileSync(`${__dirname}/../client/style.css`);
const clientJS = fs.readFileSync(`${__dirname}/../client/client.js`);
const pageNotFoundHTML = fs.readFileSync(`${__dirname}/../client/pageNotFound.html`);


// gets the index page
const getIndex = (request, response) => {
    dataHandler.respond(request, response, 200, index, 'text/html');
};
module.exports.getIndex = getIndex;

// function to get css page
const getCSS = (request, response) => {
    dataHandler.respond(request, response, 200, css, 'text/css');
  };
module.exports.getCSS = getCSS;

const getClientCode = (request, response) => {
    dataHandler.respond(request, response, 200, clientJS, 'text/javascript');

};
module.exports.getClientCode = getClientCode;


const pageNotFound = (request, response) => {

  const responseJSON = {
      message: 'Page not Found!',
      id:'Page Not Found',
  };

  if(request.acceptedTypes[0] === 'text/html') {
    return dataHandler.respond(request, response, 404, pageNotFoundHTML, 'text/html');
  }

  return dataHandler.respond(request, response, 404, responseJSON, 'application/json');
}
module.exports.pageNotFound = pageNotFound;

