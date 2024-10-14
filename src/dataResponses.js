const fs = require('fs');

const data = JSON.parse(fs.readFileSync(`${__dirname}/../datasets/DSK.json`));

// =========HELPERS=============
const getRandomInt = (max) => Math.floor(Math.random() * max);

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

// Function to return cards if they exist, otherwise returns that no cards are found.
// Will return a success no matter what, so only call if everything is alright otherwise.
const returnSomeCards = (request, response, incomingResponseJSON, foundCards) => {
  let status = 200;
  const finalResponseJSON = incomingResponseJSON;
  finalResponseJSON.cards = foundCards;
  finalResponseJSON.id = 'cardsFound';
  finalResponseJSON.cardCount = foundCards.length;

  if (foundCards.length === 0) {
    finalResponseJSON.message = 'No Cards Match the given Search Term!';
    finalResponseJSON.id = 'noCardsFound';
  } else {
    finalResponseJSON.message = `${finalResponseJSON.cardCount} Card${finalResponseJSON.cardCount === 1 ? "": "s"} Found!`;
  }

  // FOR TESTING: Returns the object itself to inspect the JSON of it
  // responseJSON.message = foundCards;

  return respond(request, response, status, finalResponseJSON, 'application/json'); // TEMP (?)
};

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

  // this is all of the cards with the search term included in the "Name" field of the card
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

// Wildcard Slot can be any card in the set, so it does not need a filter function

// returns true if the card is common and has a non foil print
const commonNonFoil = (card) => card && (card.rarity === 'common' && card.hasNonFoil);

// returns true if the card is uncommon and has a non foil print
const uncommonNonFoil = (card) => card && (card.rarity === 'uncommon' && card.hasNonFoil);

// returns true if the card is rare or mythic and has a non foil print
const rareOrMythicNonFoil = (card) => card && ((card.rarity === 'rare' || card.rarity === 'mythic') && card.hasNonFoil);

// returns true if the card has a foil printing
// this could be done in another way but... this is more consistent.
const isFoil = (card) => card && (card.hasFoil);

// returns true if any of the card's types are "Land"
// again could be done another way but this is more consistent.
const isLand = (card) => card && (card.types.includes('Land'));

const getRandomBooster = (request, response) => {
  // get information about a set of random cards that would represent a play booster -
  //   requires us to get a number of cards by their rarity/foil/whatever
  //   and then generate and pick randoms. We are IGNORING special guests
  //   and art series, etc. Other non-main set cards.

  // get the random booster data that we need
  const boosterPull = () => {
    const randomPull = getRandomInt(data.data.booster.play.boostersTotalWeight);
    let totalWeightSoFar = 0;
    let boosterIndex = -1;
    while (randomPull >= totalWeightSoFar) {
      ++boosterIndex;
      const boosterWeight = data.data.booster.play.boosters[boosterIndex].weight;

      totalWeightSoFar += boosterWeight;
    }
    return data.data.booster.play.boosters[boosterIndex];
  };
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

  // foil lands
  const foilLands = lands.filter(isFoil);

  const generatedPack = {}; // create a new empty JSON object that we return

  // every pack has these fields
  generatedPack.cards = [];
  generatedPack.cardCount = 0;
  generatedPack.boosterType = booster;

  // add randomly pulled cards
  for (let i = 0; i < booster.contents.common; ++i) {
    generatedPack.cards[generatedPack.cardCount] = commons[getRandomInt(commons.length)];
    generatedPack.cardCount += 1;
  }

  for (let i = 0; i < booster.contents.uncommon; ++i) {
    generatedPack.cards[generatedPack.cardCount] = uncommons[getRandomInt(uncommons.length)];
    generatedPack.cardCount += 1;
  }

  for (let i = 0; i < booster.contents.wildcard; ++i) {
    generatedPack.cards[generatedPack.cardCount] = wildcards[getRandomInt(wildcards.length)];
    generatedPack.cardCount += 1;
  }

  for (let i = 0; i < booster.contents.rareMythicWithShowcase; ++i) {
    generatedPack.cards[generatedPack.cardCount] = rareMythics[getRandomInt(rareMythics.length)];
    generatedPack.cardCount += 1;
  }

  // because we don't have the special guest cards, we are replacing them with another rare/mythic
  for (let i = 0; i < booster.contents.specialGuest; ++i) {
    generatedPack.cards[generatedPack.cardCount] = rareMythics[getRandomInt(rareMythics.length)];
    generatedPack.cardCount += 1;
  }

  for (let i = 0; i < booster.contents.foil; ++i) {
    generatedPack.cards[generatedPack.cardCount] = wildFoils[getRandomInt(wildFoils.length)];
    generatedPack.cardCount += 1;
  }

  for (let i = 0; i < booster.contents.land; ++i) {
    generatedPack.cards[generatedPack.cardCount] = lands[getRandomInt(lands.length)];
    generatedPack.cardCount += 1;
  }

  for (let i = 0; i < booster.contents.foilLand; ++i) {
    generatedPack.cards[generatedPack.cardCount] = foilLands[getRandomInt(foilLands.length)];
    generatedPack.cardCount += 1;
  }

  return respond(request, response, 200, generatedPack, 'application/json');
};
module.exports.getRandomBooster = getRandomBooster;

const addBooster = (request, response) => {
  const responseJSON = {
    message: 'Booster String not Found! Please input a proper Booster String. Booster Strings should only consist of numbers, whitespace, commas, and the characters :, c, u, r, w, f, and l',
  };

  const { boosterString } = request.body;

  if (!boosterString) {
    responseJSON.id = 'missingParams';
    return respond(request, response, 400, responseJSON, 'application/json');
  }

  responseJSON.message = 'Invalid Booster Format! Boosters should only consist of numbers, whitespace, commas, and the characters :, c, u, r, w, f, and l';

  const parsedString = boosterString.toLowerCase().split(':', 2);
  if (parsedString.length !== 2 || Number.isNaN(parsedString[0])) {
    responseJSON.id = 'invalidParams';
    return respond(request, response, 400, responseJSON, 'application/json');
  }

  const newBooster = {};
  newBooster.contents = {};
  newBooster.weight = +parsedString[0];
  const boosterDetails = parsedString[1].split(',');

  let foundInvalidFlag = false;

  // loop through each of the details we got
  for (let i = 0; i < boosterDetails.length; ++i) {
    const trimmedDetails = boosterDetails[i].trim();
    // if it doesn't match our basic regex, break here
    if (!trimmedDetails.match(/[curwfl]l?\d+/)) {
      foundInvalidFlag = true;
      break;
    }

    // otherwise, count the amount of letters at the start that match our things we're looking for.
    let countTotal = 0;
    while (countTotal < 2 && trimmedDetails[countTotal].match(/[curwfl]/)) {
      ++countTotal;
    }

    let addedCards = 0;
    // based on that, we handle and add data as needed.
    switch (countTotal) {
      case 1:
        // double check that the first thing is of our regex and the rest is a number
        if (!trimmedDetails[0].match(/[curwfl]/) || !trimmedDetails.substring(1).match(/\d+/)) {
          foundInvalidFlag = true;
          break;
        }
        addedCards = parseInt(trimmedDetails.substring(1), 10);
        // based on the first char, add the correct amount of thing
        switch (trimmedDetails[0]) {
          case 'c':
            newBooster.contents.common = addedCards;
            break;

          case 'u':
            newBooster.contents.uncommon = addedCards;
            break;

          case 'r':
            newBooster.contents.rareMythicWithShowcase = addedCards;
            break;

          case 'w':
            newBooster.contents.wildcard = addedCards;
            break;

          case 'f':
            newBooster.contents.foil = addedCards;
            break;

          case 'l':
            newBooster.contents.land = addedCards;
            break;

          default: // this should never run but eslint wants it
            break;
        }

        break;

      case 2:
        // if there are two matching things, they must equal 'fl', and be followed by only numbers
        if (!trimmedDetails.substring(0, 2).match('fl') || !trimmedDetails.substring(2).match(/\d+/)) {
          foundInvalidFlag = true;
          break;
        }

        // otherwise we are adding a foilLand
        addedCards = parseInt(trimmedDetails[i].substring(2), 10);
        newBooster.foilLand = addedCards;
        break;

      default:
        foundInvalidFlag = true;
        break;
    }
  }

  // we found something invalid somewhere, stop execution.
  if (foundInvalidFlag) {
    responseJSON.id = 'invalidParams';
    return respond(request, response, 400, responseJSON, 'application/json');
  }

  data.data.booster.play.boosters[data.data.booster.play.boosters.length] = newBooster;
  data.data.booster.play.boostersTotalWeight += newBooster.weight;

  return respond(request, response, 201, { message: 'New Booster Added!' }, 'application/json');
};
module.exports.addBooster = addBooster;

const addCard = (request, response) => {
  const responseJSON = {
    message: 'Cards must have a Came, Mana Cost, Type Line, and Card Text!',
  };

  const {
    cardName, manaCost, typeLine, cardText,
  } = request.body;

  if (!cardName || !manaCost || !typeLine || !cardText) {
    responseJSON.id = 'missingParams';
    return respond(request, response, 400, responseJSON, 'application/json');
  }

  // filter card by name to get if the name exists - we are matching name exactly, ignoring case.
  const nameCheck = (card) => card.name.toLowerCase() === cardName.toLowerCase();

  // store status and card index for later
  let status = 204;
  let cardIndex = data.data.cards.findIndex(nameCheck);

  // this is what actually makes a new card and updates status if we don't find a card
  if (cardIndex === -1) {
    data.data.cards[data.data.totalSetSize] = {
      name: cardName,
    };
    cardIndex = data.data.totalSetSize;
    data.data.totalSetSize += 1;
    status = 201;
  }

  // costs are formatted in braces, this section makes it so users do not need to format like that
  let encapsulatedCostString = '';
  for (let i = 0; i < manaCost.length; ++i) {
    encapsulatedCostString += `{${manaCost[i]}}`;
  }

  // update/add card cost
  data.data.cards[cardIndex].manaCost = encapsulatedCostString;

  // update type line
  data.data.cards[cardIndex].type = typeLine;

  // update card text
  data.data.cards[cardIndex].text = cardText;

  if (status === 201) {
    responseJSON.message = 'New Card Created!';
    return respond(request, response, status, responseJSON, 'application/json');
  }

  return respond(request, response, status, { message: 'Card Edited!' }, 'application/json');
};
module.exports.addCard = addCard;
