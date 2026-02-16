function getUrlVars() {
        var vars = {};
        var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
                vars[key] = value;
        });
        return vars;
}

async function login() {
        const result = await fetch('/api/getLoginInfo', {
                method: 'POST',
                body: JSON.stringify({ stateID: localStorage.getItem('state') }),
                headers: { "Content-type": "application/json" }
        });
        const json = await result.json();
        console.log(json);
        return json;
}

async function userInServer(authcode) { //Checks whether the user is a member of the Rose Rideshares Discord Server
        const result = await fetch('/api/userInServer', {
                method: 'POST',
                body: JSON.stringify({ code: authcode }),
                headers: { "Content-type": "application/json" }
        });
        const json = await result.json();
        console.log(json);
        return json;
}

function populateLoginBox(userInfo) { //Populates the login box with a user's info
        document.getElementById('loginBox').innerHTML = `<img class='dropDownInd' src='dropind.svg'><div id='loginDetails'><h3 class='loginDN'>${stopXSS(userInfo.displayName)}</h3><span class='loginUN'>${userInfo.userName}</span></div><img class='loginPic' src='${userInfo.avatar}'>`;
        document.getElementById('loginDD').classList.remove('ddNoOpen');
}

async function doOauthLogin() { //Generates the OAuth2 link for Discord login
        const result = await fetch('/api/getOauthLink', {
                method: 'POST',
                body: '{}' //Unfortunately Rose Rideshares requires all api calls to be POST, and have a non-empty body
        });
        const json = await result.json();
        console.log(json);
        window.location.href = json.link;
}

function stopXSS(str) {
        const htmlEscapeMap = {
                '&': '&#x0026;',
                '<': '&#x003c;',
                '>': '&#x003e;',
                '"': '&#x0022;',
                "'": '&#x0027;'
        };
        return str.replace(/[&<>"']/g, char => htmlEscapeMap[char]);
}