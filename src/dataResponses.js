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
    status = 206; //partial content - no CARDS, but info that there are no cards.
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

  // this is all of the cards with the search term included in the "Name" field of the card - case insensitive
  const foundCards = data.data.cards.filter(cardFilter);

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

// Card Search Methods - they don't change between runs of the code
//   Although the things they return will once cards are added via POST

//Wildcard Slot can be any card in the set, so it does not need a filter function

// returns true if the card is common and has a non foil print
const commonNonFoil = (card) => {
    return card.rarity === "common" && card.hasNonFoil;
};

//returns true if the card is uncommon and has a non foil print
const uncommonNonFoil = (card) => {
    return card.rarity === "uncommon" && card.hasNonFoil;
};

//returns true if the card is rare or mythic and has a non foil print
const rareOrMythicNonFoil = (card) => {
    return (card.rarity === "rare" || card.rarity === "mythic") && card.hasNonFoil;
};

//returns true if the card has a foil printing
//this could be done in another way but... this is more consistent. 
const isFoil = (card) => {
    return card.hasFoil;
}

//returns true if any of the card's types are "Land"
// again could be done another way but this is more consistent.
const isLand = (card) => {
    return card.types.includes("Land");
}



const getRandomBooster = (request, response) => {
  // get information about a set of random cards that would represent a play booster -
  //   requires us to get a number of cards by their rarity/foil/whatever 
  //   and then generate and pick randoms. We are IGNORING special guests
  //   and art series, etc. Other non-main set cards. 

  // get the random booster data that we need
  const boosterPull = () => {
        const randomPull = getRandomInt(data.data.booster.play.boostersTotalWeight);
        console.log(randomPull + " " + data.data.booster.play.boostersTotalWeight);
        let totalWeightSoFar = 0;
        let boosterIndex = -1;
        while(randomPull >= totalWeightSoFar) {
            ++boosterIndex; 
            let boosterWeight = data.data.booster.play.boosters[boosterIndex].weight;

            totalWeightSoFar += boosterWeight;
        }
        return data.data.booster.play.boosters[boosterIndex];
  }
  const booster = boosterPull();

  // filtered copies of the cardset
  // wildcard - all of the cards in the set.
  const wildcards = data.data.cards;

  // common slots
  const commons = wildcards.filter(commonNonFoil);

  // uncommon slots
  const uncommons = wildcards.filter(uncommonNonFoil);

  // rares and mythics
  const rareMythics = wildcards.filter(rareOrMythicNonFoil);

  // wildcard FOIL
  const wildFoils = wildcards.filter(isFoil);

  // land
  const lands = wildcards.filter(isLand);

  //foil lands
  const foilLands = lands.filter(isFoil);

  const generatedPack = {}; //create a new empty JSON object that we return

  //every pack has these fields
  generatedPack.cards = [];
  generatedPack.cardCount = 0;
  generatedPack.boosterType = booster;

  //add randomly pulled cards
  for(let i = 0; i < booster.contents.common; ++i ) {
    generatedPack.cards[generatedPack.cardCount] = commons[getRandomInt(commons.length)];
    generatedPack.cardCount += 1;
  }

  for(let i = 0; i < booster.contents.uncommon; ++i ) {
    generatedPack.cards[generatedPack.cardCount] = uncommons[getRandomInt(uncommons.length)];
    generatedPack.cardCount += 1;
  }

  for(let i = 0; i < booster.contents.wildcard; ++i ) {
    generatedPack.cards[generatedPack.cardCount] = wildcards[getRandomInt(wildcards.length)];
    generatedPack.cardCount += 1;
  }

  for(let i = 0; i < booster.contents.rareMythicWithShowcase; ++i ) {
    generatedPack.cards[generatedPack.cardCount] = rareMythics[getRandomInt(rareMythics.length)];
    generatedPack.cardCount += 1;
  }

  //because we don't have the special guest cards, we are replacing them with another rare/mythic slot
  for(let i = 0; i < booster.contents.specialGuest; ++i ) {
    generatedPack.cards[generatedPack.cardCount] = rareMythics[getRandomInt(rareMythics.length)];
    generatedPack.cardCount += 1;
  }

  for(let i = 0; i < booster.contents.foil; ++i ) {
    generatedPack.cards[generatedPack.cardCount] = wildFoils[getRandomInt(wildFoils.length)];
    generatedPack.cardCount += 1;
  }

  for(let i = 0; i < booster.contents.land; ++i ) {
    generatedPack.cards[generatedPack.cardCount] = lands[getRandomInt(lands.length)];
    generatedPack.cardCount += 1;
  }

  for(let i = 0; i < booster.contents.foilLand; ++i ) {
    generatedPack.cards[generatedPack.cardCount] = foilLands[getRandomInt(foilLands.length)];
    generatedPack.cardCount += 1;
  }
  



  return respond(request, response, 200, generatedPack, 'application/json');

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


// =========HELPERS=============
const getRandomInt = (max) => {
    return Math.floor(Math.random() * max)
}