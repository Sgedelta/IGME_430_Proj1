const fs = require('fs');

const data = JSON.parse(fs.readFileSync(`${__dirname}/../datasets/DSK.json`));

// generic response, not JSON specifically.
const respond = (request, response, status, content, type) => {
  let fixedContent = content;

  if (type === 'application/json') {
    fixedContent = JSON.stringify(content);
  }

  response.writeHead(status, {
    'Content-Type': type,
    'Content-Length': Buffer.byteLength(fixedContent, 'utf8'),
  });

  if (request.method !== 'HEAD' && status !== 204) {
    response.write(fixedContent);
  }

  response.end();
};
// exported so that we can use it in htmlResponses - cleaner and less repeated code.
module.exports.respond = respond;

const getWholeSet = (request, response) => {
// just return all of the set data -
//  this is simple and not really that interesting, but this is the naive response
  respond(request, response, 200, data, 'application/json');
};
module.exports.getWholeSet = getWholeSet;

const getAllCards = (request, response) => {
// return the cards array
  respond(request, response, 200, data.data.cards, 'application/json');
};
module.exports.getAllCards = getAllCards;

// Function to return cards if they exist, otherwise returns that no cards are found.
// Will return a success no matter what, so only call if everything is alright otherwise.
const returnSomeCards = (request, response, incomingResponseJSON, foundCards) => {
  let status = 200;
  const finalResponseJSON = incomingResponseJSON;
  finalResponseJSON.message = foundCards;
  finalResponseJSON.id = 'cardsFound';
  finalResponseJSON.cardCount = foundCards.length;

  if (foundCards.length === 0) {
    status = 204;
    finalResponseJSON.message = 'No Cards Match the given Search Term!';
    finalResponseJSON.id = 'noCardsFound';
  }

  // FOR TESTING: Returns the object itself to inspect the JSON of it
  // responseJSON.message = foundCards;

  return respond(request, response, status, finalResponseJSON, 'application/json'); // TEMP (?)
};

const getCardByName = (request, response) => {
  const responseJSON = {
    message: 'Card Name must be provided!',
  };

  const { searchTerm: unparsedSearchTerm } = request.query;

  if (!unparsedSearchTerm) {
    responseJSON.id = 'missingParams';
    return respond(request, response, 400, responseJSON, 'application/json');
  }

  const parsedSearchTerms = unparsedSearchTerm.toLowerCase().split(',');

  const cardFilter = (card) => {
    let found = false;
    for (let i = 0; i < parsedSearchTerms.length; ++i) {
      found = found || card.name.toLowerCase().includes(parsedSearchTerms[i]);
    }
    return found;
  };

  // this is all of the cards with the EXACT search term included in the "Name" field of the card
  const foundCards = data.data.cards.filter(cardFilter);
  // In the future, we can expand this to a lot of or conditions and split up the
  // search term by commas or quotes or whatever. Make it more robust.

  // temporary response of just.. all the data as a string.
  // responseJSON.message = `Filtered Cards Are: ${JSON.stringify(foundCards)}`;
  // This is where in the future we can return the data OR return a meaningful
  //    message if we didn't find anything (Filter came back as zero)

  return returnSomeCards(request, response, responseJSON, foundCards);
};
module.exports.getCardByName = getCardByName;

const getCardByKeyword = (request, response) => {
  // similar implementation to Card By Name -> instead of checking card.name 
  //   check card.keywords or MAYBE card.text // card.originalText?

  const responseJSON = {
    message: 'Keyword must be provided!',
  };

  const { searchTerm: unparsedSearchTerm } = request.query;

  if (!unparsedSearchTerm) {
    responseJSON.id = 'missingParams';
    return respond(request, response, 400, responseJSON, 'application/json');
  }

  const parsedSearchTerms = unparsedSearchTerm.toLowerCase().split(',');

  // function that checks for if the card has any of the given keywords
  const cardFilter = (card) => {
    let found = false;
    for (let term = 0; term < parsedSearchTerms.length; ++term) {
      if (card.keywords) { // some cards do not have keywords, and the "keywords" field DNE
        for (let keyword = 0; keyword < card.keywords.length; ++keyword) {
          found = found || card.keywords[keyword].toLowerCase().includes(parsedSearchTerms[term]);
        }
      }
    }
    return found;
  };

  const foundCards = data.data.cards.filter(cardFilter);

  return returnSomeCards(request, response, responseJSON, foundCards);
};
module.exports.getCardByKeyword = getCardByKeyword;

const getRandomBooster = (request, response) => {
  // get information about a set of random cards that would represent a play booster - requires us to get a number of cards by their rarity/foil/whatever and then generate and pick randoms
  // The rarity/foil/whatever won't change, so we could generate them as const before this is called for effeciency, then just pull random, but they won't include any "added" cards that we POST
  //  so it's probably better to NOT do that and generate it on function call, even though that's not great with .filter() effeciency....
};
module.exports.getRandomBooster = getRandomBooster;

const addUser = (request, response) => { // TEMP: Add User is still here so we can quickly generate post methods without referencing other things. Will be removed.
  const responseJSON = {
    message: 'Name and Age are both required',
  };

  const { name, age } = request.body;

  if (!name || !age) {
    responseJSON.id = 'missingParams';
    return respond(request, response, 400, responseJSON, 'application/json');
  }

  let status = 204;

  if (!users[name]) {
    status = 201;
    users[name] = {
      name,
    };
  }

  users[name].age = age;

  if (status === 201) {
    responseJSON.message = 'New User Created!';
    return respond(request, response, status, responseJSON, 'application/json');
  }

  return respond(request, response, status, {}, 'application/json');
};
module.exports.addUser = addUser;
