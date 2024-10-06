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

    const foundCards = data.data.cards.filter((card) => card.name.includes(searchTerm)); //this is all of the cards with the EXACT search term included in the "Name" field of the card
    // In the future, we can expand this to a lot of or conditions and split up the search term by commas or quotes or whatever. Make it more robust.
    
    //responseJSON.message = `Filtered Cards Are: ${JSON.stringify(foundCards)}`; //temporary response of just.. all the data as a string.
    // This is where in the future we can return the data OR return a meaningful message if we didn't find anything (Filter came back as zero)

    responseJSON.message = foundCards; // FOR TESTING: Returns the object itself to inspect the JSON of it

    respond(request, response, 200, responseJSON, 'application/json'); //TEMP (?)
};
module.exports.getCardByName = getCardByName;

const getCardByKeyword = (request, response) => {
    //similar implementation to Card By Name -> instead of checking card.name check card.keywords or MAYBE card.text // card.originalText?
};
module.exports.getCardByKeyword = getCardByKeyword;

const getRandomBooster = (request, response) => {
    //get information about a set of random cards that would represent a play booster - requires us to get a number of cards by their rarity/foil/whatever and then generate and pick randoms
        // The rarity/foil/whatever won't change, so we could generate them as const before this is called for effeciency, then just pull random, but they won't include any "added" cards that we POST
        //  so it's probably better to NOT do that and generate it on function call, even though that's not great with .filter() effeciency....
};
module.exports.getRandomBooster = getRandomBooster;

const addUser = (request, response) => { //TEMP: Add User is still here so we can quickly generate post methods without referencing other things. Will be removed. 
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
