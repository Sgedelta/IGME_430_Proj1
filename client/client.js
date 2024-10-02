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
    
    
        if(responseJSON.users) {
          let jsonString = JSON.stringify(responseJSON.users);
          content.innerHTML += `<p>${jsonString}</p>`;
        }
    
    } else {
      content.innerHTML += '<p>Metadata Recieved</p>'
    }
    
    };
    
    const requestUpdate = async (form) => {
    const url = form.querySelector('#urlField').value;
    const method = form.querySelector('#methodSelect').value;
    
    let response = await fetch(url, {
        method, 
        headers: {
            'Accept': 'application/json'
        },
    });
    
    handleResponse(response, method === 'get');
    };
    
    const sendPost = async (form) => {
    const url = form.getAttribute('action');
    const method = form.getAttribute('method');
    
    const nameField = form.querySelector("#nameField");
    const ageField = form.querySelector("#ageField");
    
    const formData = `name=${nameField.value}&age=${ageField.value}`;
    
    let response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: formData,
      });
    
    handleResponse(response, true);
    }
    
    const init = () => {
    const form = document.querySelector("#userForm");
    const postForm = document.querySelector("#nameForm");
    
    const getUser = (e) => {
        e.preventDefault();
        requestUpdate(form);
        return false;
    }
    
    const addUser = (e) => {
        e.preventDefault();
        sendPost(postForm);
        return false;
    }
    
    form.addEventListener('submit', getUser);
    postForm.addEventListener('submit', addUser);
    };
    
    window.onload = init;
    
    
    
    