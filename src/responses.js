const fs = require('fs');

const index = fs.readFileSync(`${__dirname}/../client/client.html`);
const css = fs.readFileSync(`${__dirname}/../client/style.css`);

const users = {};

// generic response, not JSON specifically.
const respond = (request, response, status, content, type ) => {

    if(type === 'application/json') {
        content = JSON.stringify(content);
    }

    response.writeHead(status, {
      'Content-Type': type,
      'Content-Length': Buffer.byteLength(content, 'utf8'),
    });
    
    if (request.method !== 'HEAD' && status !== 204) {
      response.write(content);
    }
  
    response.end();
};

// gets the index page
const getIndex = (request, response) => {
    respond(request, response, 200, index, 'text/html');
};
module.exports.getIndex = getIndex;

// function to get css page
const getCSS = (request, response) => {
    respond(request, response, 200, css, 'text/css');
  };
module.exports.getCSS = getCSS;

const getUsers = (request, response) => {
    const responseJSON = {
        users
    };

    return respond(request, response, 200, responseJSON, 'application/json');
};
module.exports.getUsers = getUsers;

const addUser = (request, response) => {
    const responseJSON = {
        message: 'Name and Age are both required',
    };

    const { name, age } = request.body;

    if(!name || !age) {
        responseJSON.id = 'missingParams';
        return respond(request, response, 400, responseJSON, 'application/json');
    }

    let status = 204;

    if(!users[name]) {
        status = 201;
        users[name] = {
            name: name,
        };
    }

    users[name].age = age;

    if(status === 201) {
        responseJSON.message = 'New User Created!';
        return respond(request, response, status, responseJSON, 'application/json');
    }

    return respond(request, response, status, {}, 'application/json');
};
module.exports.addUser = addUser;

const pageNotFound = (request, response) => {
    const responseJSON = {
        message: 'Page not Found!',
        id:'Page Not Found',
    };

    return respond(request, response, 404, responseJSON, 'application/json');
}
module.exports.pageNotFound = pageNotFound;