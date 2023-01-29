var timestamp = 0;
document.getElementById("timeIn").oninput = function() {
    timestamp = new Date(document.getElementById("timeIn").value).getTime();
    console.log(timestamp);
}


document.getElementById("rideform").onsubmit = async function(e) {
    e.preventDefault();
    var formData = new FormData(document.getElementById("rideform"));
    document.body.style.background = "transparent";
    document.body.innerHTML = "<iframe src='loading.svg' style='position: absolute; top: calc(50% - 100px); left: calc(50% - 100px); width: 200px; height: 200px; border: none'>";
    var formObject = Object.fromEntries(formData);
    formObject.stateID = parent.stateID;
    formObject.type = parent.type;
    formObject.when = timestamp;
    const result = await fetch('/api/submitRideEvent', {
        method: 'POST',
        body: JSON.stringify(formObject),
        headers: {"Content-type": "application/json"}
    });
    const json = await result.json();
    location.href = "success.html";
}

document.body.onload = loadCategories;
async function loadCategories() {
        const result = await fetch('/api/getCategories', {
            method: 'POST',
            body: '[]',
            headers: {"Content-type": "application/json"}
        });
        const json = await result.json();
        console.log(json);
        html = "<option value='' disabled selected>Select a Category</option>";
        for(var i = 0; i < json.length; i++){
            html += `<option>${json[i]}</option>`;
        }
        document.getElementById('categorySelect').innerHTML = html;
}
