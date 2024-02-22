                function getUrlVars() {
                        var vars = {};
                        var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
                                vars[key] = value;
                        });
                        return vars;
                }

                async function login() {
                        const result = await fetch('/api/getLoginInfo', {
                                method: 'POST',
                                body: JSON.stringify({stateID: localStorage.getItem('state')}),
                                headers: {"Content-type": "application/json"}
                        });
                        const json = await result.json();
                        console.log(json);
                        return json;
                }

                async function userInServer(authcode) {
                        const result = await fetch('/api/userInServer', {
                                method: 'POST',
                                body: JSON.stringify({code: authcode}),
                                headers: {"Content-type": "application/json"}
                        });
                        const json = await result.json();
                        console.log(json);
                        return json;
                }

                function populateLoginBox(userInfo) {
                        document.getElementById('loginBox').innerHTML = `<img class='dropDownInd' src='dropind.svg'><div id='loginDetails'><h3 class='loginDN'>${userInfo.displayName}</h3><span class='loginUN'>${userInfo.userName}</span></div><img class='loginPic' src='${userInfo.avatar}'>`;
                        document.getElementById('loginDD').classList.remove('ddNoOpen');
                }
