/*var timestamp = 0;
document.getElementById("timeIn").oninput = function() {
    timestamp = new Date(document.getElementById("timeIn").value).getTime();
    console.log(timestamp);
}*/
var rideID;

document.getElementById("rideform").onsubmit = async function(e) {
    e.preventDefault();
    var formElement = document.getElementById("rideform");
    var formData = new FormData(formElement);
    document.body.style.background = "transparent";
    document.body.innerHTML = "<iframe src='loading.svg' style='position: absolute; top: calc(50% - 100px); left: calc(50% - 100px); width: 200px; height: 200px; border: none'>";
    var formObject = Object.fromEntries(formData);
    formObject.stateID = parent.stateID;
    formObject.isOffer = isOffer;
    //formObject.whenRaw = timestamp;
    formObject.whence = from;
    formObject.dest = to;
    formObject.rideID = rideID;
    //formObject.tz = document.getElementById("timeZone").value;
    const result = await fetch(formElement.getAttribute("rr_submit_endpoint"), {
        method: 'POST',
        body: JSON.stringify(formObject),
        headers: {"Content-type": "application/json"}
    });
    const json = await result.json();
    if(json.error != null){
      alert(json.error);
    } else {
      location.href = "success.html";
    }
}

// document.body.onload = loadCategories;
// async function loadCategories() {
//         const result = await fetch('/api/getCategories', {
//             method: 'POST',
//             body: '[]',
//             headers: {"Content-type": "application/json"}
//         });
//         const json = await result.json();
//         console.log(json);
//         html = "<option value='' disabled selected>Select a Category</option>";
//         for(var i = 0; i < json.length; i++){
//             html += `<option>${json[i]}</option>`;
//         }
//         document.getElementById('categorySelect').innerHTML = html;
// }

      var currentFeatures;
      async function populateSuggestions() {
        if(document.getElementById("searchBox").value == "") {
          console.log("falling back to favorites");
          var result = await fetch("favorites.json");
        } else {
          var result = await fetch("https://nominatim.openstreetmap.org/search?q="+event.target.value + "&format=jsonv2");
        }
        var json = await result.json();
        console.log(json);
        currentFeatures = json;
        var generated = "";
        for(var i = 0; i < json.length; i++){
          var feature = json[i];
          generated += `<div class="result" onclick="pickLocation(${i})"><h2>${feature.name}</h2><span>${trimFullName(feature)}</span></div>`;
        }
        document.getElementById("suggestions").innerHTML = generated;
      }

      var from;
      var to;
      var searchingTo = true;
      document.getElementById("timeZone").value = Intl.DateTimeFormat().resolvedOptions().timeZone;

      function trimFullName(feature) {
        return trimLabel(feature.display_name);
      }

      function trimLabel(input) {
        var output = input.substring(input.split(",")[0].length + 2);
        if(output.length > 50) {
          output = output.substring(0, 47) + "...";
        }
        return output;
      }

      function showSearch() {
        if(searchingTo){
          document.getElementById("searchTitle").innerText = "Pick a Destination";
        } else {
          document.getElementById("searchTitle").innerText = "Pick an Origin";
        }
        document.getElementById("formPane").style.left = "105vw";
        document.getElementById("searchPane").style.left = "0vw";
      }

      function showForm() {
        document.getElementById("formPane").style.left = "0vw";
        document.getElementById("searchPane").style.left = "-105vw";
      }

      function pickLocation(item) {
        if(searchingTo) {
          to = currentFeatures[item];
        } else {
          from = currentFeatures[item];
        }
        genFromTo();
        showForm();
      }

      function genFromTo() {
        document.getElementById("toName").innerText = to.name;
        document.getElementById("toFull").innerText = trimFullName(to);
        document.getElementById("fromName").innerText = from.name;
        document.getElementById("fromFull").innerText = trimFullName(from);
      }

      function chooseTo() {
        searchingTo = true;
        showSearch();
      }

      function chooseFrom() {
        searchingTo = false;
        showSearch();
      }
