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
    formObject.whence = from;
    formObject.dest = to;
    const result = await fetch('/api/submitRideEvent', {
        method: 'POST',
        body: JSON.stringify(formObject),
        headers: {"Content-type": "application/json"}
    });
    const json = await result.json();
    location.href = "success.html";
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
          var result = await fetch("https://geocode.maps.co/search?q="+event.target.value+"&format=geocodejson");
        }
        var json = await result.json();
        currentFeatures = json.features;
        var generated = "";
        for(var i = 0; i < json.features.length; i++){
          var feature = json.features[i];
          generated += `<div class="result" onclick="pickLocation(${i})"><h2>${feature.properties.geocoding.name}</h2><span>${trimFullName(feature)}</span></div>`;
        }
        document.getElementById("suggestions").innerHTML = generated;
      }

      var from;
      var to;
      var searchingTo = true;
      populateSuggestions().then(function() {
        from = currentFeatures[0];
      });

      function trimFullName(feature) {
        var output = feature.properties.geocoding.label.substring(feature.properties.geocoding.name.length + 2);
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
        document.getElementById("toName").innerText = to.properties.geocoding.name;
        document.getElementById("toFull").innerText = trimFullName(to);
        document.getElementById("fromName").innerText = from.properties.geocoding.name;
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
