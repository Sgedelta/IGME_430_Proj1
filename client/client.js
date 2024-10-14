const handleResponse = async (response, parseResponse) => {

    const content = document.querySelector("#content");
    
    switch(response.status) {
        case 200:
            content.innerHTML = '<b>Success!</b>';
            break;
        case 201:
            content.innerHTML = '<b>Created!</b>';
            break;
        case 204:
            content.innerHTML = '<b>Updated - No Content</b>';
            break;
        case 400: 
            content.innerHTML = '<b>Bad Request</b>';
            break;
        case 404:
            content.innerHTML = '<b>Page Not Found!</b>';
            break;
        default:
            content.innerHTML = 'Status Code not implemented by Client';
            break;
    }
    
    
    
    if(parseResponse) {
        const responseJSON = await response.json();
    
        if(responseJSON.message) {
          content.innerHTML += `<p>${responseJSON.message}</p>`;
        }

        //get the card list, it's in two different places in different responses
        let cardList = responseJSON.cards;
        if(responseJSON.data) {
            cardList = cardList || responseJSON.data.cards;
        }

        if(cardList) {
            let addedText = '<p class="cardDisplay"><hr>'
            for(let i = 0; i < cardList.length; ++i) {
                let card = cardList[i];
                addedText += `<span class="card">${card.name}: `;
                if(card.manaCost) { //some cards do not have a mana cost
                    addedText += `${card.manaCost}, `;
                }
                addedText += `${card.type}, ${card.text}</span>`;
                addedText += "<hr>";
            }
            addedText += '</p>';
            content.innerHTML += addedText;
        }
        
    
    } else {
      content.innerHTML += '<p>Metadata Recieved</p>'
    }
    
};
    
const requestUpdate = async (form) => {
    const url = form.querySelector('#urlField').value;
    const method = form.querySelector('#methodSelect').value;

    const searchTerm = form.querySelector('#searchField').value;
    const formData = `?searchTerm=${searchTerm}`;
    
    let response; 
    //if we have search terms, send with those
    if(searchTerm) {
        response = await fetch(url + formData, {
            method, 
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
        });
    } else {
        //otherwise, don't send with search terms
        response = await fetch(url, {
            method, 
            headers: {    
                'Accept': 'application/json'
            },
        });
    }

    handleResponse(response, method === 'get');
    };
    
    const sendBooster = async (form) => {
    const boosterField = form.querySelector("#boosterStringField");
    
    const formData = `boosterString=${boosterField.value}`;

    sendPost(form, formData);

};

const sendCard = async (form) => {
        const name = form.querySelector("#nameField");
        const cost = form.querySelector("#manaCostField");
        const type = form.querySelector("#typeLineField");
        const text = form.querySelector("#cardTextField");

        const formData = `cardName=${name.value}&manaCost=${cost.value}&typeLine=${type.value}&cardText=${text.value}`;
        
        sendPost(form, formData);
    }

    const sendPost = async (form, formData) => {
        const url = form.getAttribute('action');
        const method = form.getAttribute('method');
        
        let response = await fetch(url, {
            method: method,
            headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: formData,
      });
    
    handleResponse(response, true);
};
    
const init = () => {
    const form = document.querySelector("#userForm");
    const boosterForm = document.querySelector("#boosterForm");
    const cardForm = document.querySelector("#cardForm");

    const getWholeSet = (e) => {
        e.preventDefault();
        requestUpdate(form);
        return false;
    }
    
    const addBooster = (e) => {
        e.preventDefault();
        sendBooster(boosterForm);
        return false;
    }

    const addCard = (e) => {
        e.preventDefault();
        sendCard(cardForm);
        return false;
    }

    form.addEventListener('submit', getWholeSet);
    boosterForm.addEventListener('submit', addBooster);
    cardForm.addEventListener('submit', addCard);


    console.log("Client Code Loaded!");
};
    
window.onload = init;
    
    
    
    