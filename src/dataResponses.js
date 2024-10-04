const fs = require('fs');

const data = JSON.parse(fs.readFileSync(`${__dirname}/../datasets/DSK.json`));

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
module.exports.respond = respond; //exported so that we can use it in htmlResponses - cleaner and less repeated code. 


const getWholeSet = (request, response) => {
    //just return all of the set data - this is simple and not really that interesting, but this is the simpl
    return respond(request, response, 200, data, 'application/json');
};
module.exports.getWholeSet = getWholeSet;

const getAllCards = (request, response) => {
    //return the cards array
    return respond(request, response, 200, data.data.cards, 'application/json');
};
module.exports.getAllCards = getAllCards;

const getCardByName = (request, response) => {
    const responseJSON = {
        message: 'Card Name must be provided!',
    }

    const { searchTerm } = request.query;

    if(!searchTerm) {
        responseJSON.id = 'missingParams';
        return respond(request, response, 400, responseJSON, 'application/json');
    }

    responseJSON.message = `Search Term Was: ${searchTerm}`; //temp

    respond(request, response, 200, responseJSON, 'application/json'); //TEMP
};
module.exports.getCardByName = getCardByName;

const getCardByKeyword = (request, response) => {

};
module.exports.getCardByKeyword = getCardByKeyword;

const getRandomBooster = (request, response) => {

};
module.exports.getRandomBooster = getRandomBooster;

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
