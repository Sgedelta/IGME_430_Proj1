const fs = require('fs');
const dataHandler = require('./dataResponses.js');

const index = fs.readFileSync(`${__dirname}/../client/client.html`);
const css = fs.readFileSync(`${__dirname}/../client/style.css`);
const clientJS = fs.readFileSync(`${__dirname}/../client/client.js`);
const pageNotFound = fs.readFileSync(`${__dirname}/../client/pageNotFound.html`);


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


const get404Page = (request, response) => {
  dataHandler.respond()
}