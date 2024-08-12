const pg = require('./connectPostgres.js');
require('dotenv').config();
const {Client, User, EmbedBuilder} = require('discord.js');
const Logger = require("./logger.js");
var moment = require('moment-timezone');
const constants = require("./constants.js");
const { Offer, Request, RideEvent } = require("./rideEventBuilder.js");


const getLoginInfo = async function(dcClient, args, res) {
    var stateID = args["stateID"];
    if(stateID == null) {
        res.end('{"error": "Must supply stateID"}');
        return;
    } else if (stateID.length < 32) { //Don't bother querying the DB if the state isn't long enough to be a valid UUID
        res.end('{"isValid": false}');
        return;
    }
    try{
        var dataToSend = {};
        var pgClient = pg.getNewClient();
        await pgClient.connect();
        var validateQuery = 'SELECT * from validateState($1)';
        const pgResponse = await pgClient.query(validateQuery, [stateID]);
        var valid =  pgResponse.rows[0];
        dataToSend.stateValid = valid['isvalid'];
        if(valid['isvalid']){
            var discordInfo = await dcClient.users.fetch(valid['did']);
            dataToSend.user = {
                id: valid['id'],
                userName: discordInfo.username,
                displayName: discordInfo.globalName,
                avatar: discordInfo.avatarURL()
            }
            //TODO: Call InsertUpdateUser with the new info to update user entries in the database
        }
        res.end(JSON.stringify(dataToSend));
        await pgClient.end();
    } catch (e) {
        console.log(e);
        res.end('{"error": "An error occured"}');
    }
};

const getRidesByUser = async function(args, res) {
    var stateID = args["stateID"];
    if(stateID == null) {
        res.end('{"error": "Must supply stateID"}');
        return;
    }
    try{
        var dataToSend = {};
        var pgClient = pg.getNewClient();
        await pgClient.connect();
        var validateQuery = 'SELECT * from validateState($1)';
        const pgResponse = await pgClient.query(validateQuery, [stateID]);
        var valid =  pgResponse.rows[0];
        if(valid['isvalid']){
            var ridesQuery = 'select * from getridesbyuser($1)';
            const ridesResponse = await pgClient.query(ridesQuery, [valid['did']]);
            dataToSend = ridesResponse.rows;
        } else {
            dataToSend.error = "State was invalid.";
        }
        res.end(JSON.stringify(dataToSend));
        await pgClient.end();
    } catch (e) {
        console.log(e);
        res.end('{"error": "An error occured"}');
    }
};

const viewSingleRide = async function(args, res) {
    var rideID = args["rideID"];
    if(rideID == null) {
        res.end('{"error": "Must supply rideID"}');
        return;
    }
    try{
        var dataToSend = {};
        var pgClient = pg.getNewClient();
        await pgClient.connect();
        var ridesQuery = 'select * from getRideByID($1)';
        const ridesResponse = await pgClient.query(ridesQuery, [rideID]);
        dataToSend = ridesResponse.rows[0];
        res.end(JSON.stringify(dataToSend));    
        await pgClient.end();
    } catch (e) {
        console.log(e);
        res.end('{"error": "An error occured"}');
    }
};

const editRides = async function(dcClient, args, res) {
    var rideID = args["rideID"];
    var stateID = args["stateID"];
    if(rideID == null) {
        res.end('{"error": "Must supply rideID"}');
        return;
    }
    if(stateID == null) {
        res.end('{"error": "Must supply stateID"}');
        return;
    }
    try{
        var pgClient = pg.getNewClient();
        await pgClient.connect();
        var validateQuery = 'SELECT * from validateState($1)';
        const pgResponse = await pgClient.query(validateQuery, [stateID]);
        var valid =  pgResponse.rows[0];
        if(valid['isvalid']){
            args['when'] = moment.tz(args['whenRaw'], args['tz']).valueOf();
            var ridesQuery = 'call editRides($1, to_timestamp($2 / 1000.0)::timestamp, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)';
            var params = [rideID, args["when"], args["vehicleInfo"], args["info"], args['isOffer'], args['status'], args.whence.name, args.whence.display_name, args.whence.type, args.whence.lat, args.whence.lon, args.dest.name, args.dest.display_name, args.dest.type, args.dest.lat, args.dest.lon];
            Logger.logDebug(params);
            await pgClient.query(ridesQuery, params);
        } else {
            res.end('{"error": "The provided state was not valid."}');
        }
        await pgClient.end();
        //We've updated the DB, but we still need to update the message on Discord
        var rdEvt = await RideEvent.getRideById(rideID);
        rdEvt.updateRideMessage(dcClient);
        res.end('{"status": "success"}');
    } catch (e) {
        Logger.logError(e);
        res.end('{"error": "An error occured"}');
    }
};

const userInServer = async function(dcClient, args, res) {
    const code = args["code"];
    const redir = constants.HOSTNAME + "oauthLanding.html";

    Logger.logDebug(args);
    Logger.logDebug(redir);

    const params = new URLSearchParams();
    params.append('client_id', process.env.CLIENT_ID);
    params.append('client_secret', process.env.CLIENT_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redir);
    params.append('scope', 'identify');

    //First, we convert the OAUTH code to a token that can be used in future API calls
    var response = await fetch("https://discord.com/api/oauth2/token", {
        method: 'POST',
        body: params,
        headers: {
            "Content-type": "application/x-www-form-urlencoded"
        },
    });
    const token = await response.json();

    Logger.logDebug(token);

    //We then get the user's information
    response = await fetch('https://discord.com/api/users/@me', {
		method: "GET",
        headers: {
            Authorization: `${token["token_type"]} ${token["access_token"]}`
		}
	});
    const user = await response.json(); //Limited user info retured by querying the API with the user's token
    console.log(user);

    const uid = user["id"];
    console.log(uid);

    const guild = await dcClient.guilds.fetch(process.env.GUILD_ID);
    try{
        const guildUserData = await guild.members.fetch(uid);
        console.log(guildUserData);
    } catch (e) {
        if(e.rawError.code == 10007) {
            Logger.logDebug(`Refusing to authenticate ${user.tag} because they are not a member of the guild.`);
            res.end(JSON.stringify({error: 1}));
        } else {
            res.writeHead(500);
            Logger.logError(e);
            res.end(JSON.stringify({error: 2}));
        }
    }

    const userInfo = await dcClient.users.fetch(uid); //Full user info returned by querying the API as Rideshare Bot

    var pgClient = pg.getNewClient();
    await pgClient.connect();

    var validateQuery = "CALL upsertuser($1, $2, $3, $4)";
    const voidResponse = await pgClient.query(validateQuery, [uid, user["global_name"], user["username"], userInfo.avatarURL()]);

    var createQuery = "SELECT createState($1)";
    const pgResponse = await pgClient.query(createQuery, [uid]);
    var valid = pgResponse.rows[0];
    
    res.end(JSON.stringify(valid));
    await pgClient.end();
};

const search = async function(args, res) {
    const query = args.query;
    const type = args.type;

    var pgClient = pg.getNewClient();
    await pgClient.connect();

    var validateQuery = `SELECT * FROM searchrides('d', $1)`; //Searching destinations is hardcoded currently, switch d to o to search locations
    const pgResponse = await pgClient.query(validateQuery, [query]);
    //console.log(pgResponse.rows[0]);

    // res.end the response table in correct format
    var offers = [];
    var requests = [];
    for (var ride in pgResponse.rows) {
        var row = pgResponse.rows[ride];
        console.log(row);
        if (row.vehicleinfo) {
            offers.push({
                "timestamp": new Date(row.createdtime).getTime(),
                "target": {"username": row.username, "avatarURL": row.avatarurl, "globalName": row.displayname},
                "dest": {
                    "properties": {"geocoding": {"type": row.dltype, "label": row.dllabel, "name": row.dlname}},
                    coordinates: {lat: row.dlat, long: row.dlong}},
                "whence": {
                    "properties": {"geocoding": {"type": row.oltype, "label": row.ollabel, "name": row.olname}},
                    coordinates: {lat: row.olat, long: row.olong}},
                "when": new Date(row.departuretime).getTime(),
                "payment": row.ridepayment,
                "info": row.rideinfo,
                "status": row.ridestatus,
                "vehicleInfo": row.vehicleinfo,
                "cat": row.cat,
                "message": {"channelId": `"${row.dchannelid}"`, "guildId": `"${row.dguildid}"`, "id": `"${row.dmessageid}"`}});
        } else {
            requests.push({
                "timestamp": new Date(row.createdtime).getTime(),
                "target": {"username": row.username, "avatarURL": row.avatarurl, "globalName": row.displayname},
                "dest": {
                    "properties": {"geocoding": {"type": row.dltype, "label": row.dllabel, "name": row.dlname}},
                    coordinates: {lat: row.dlat, long: row.dlong}},
                "whence": {
                    "properties": {"geocoding": {"type": row.oltype, "label": row.ollabel, "name": row.olname}},
                    coordinates: {lat: row.olat, long: row.olong}},
                "when": new Date(row.departuretime).getTime(),
                "payment": row.ridepayment,
                "info": row.rideinfo,
                "status": row.ridestatus,
                "cat": row.cat,
                "message": {"channelId": `"${row.dchannelid}"`, "guildId": `"${row.dguildid}"`, "id": `"${row.dmessageid}"`}});
        }
    }

    var result = `[${JSON.stringify(requests)}, ${JSON.stringify(offers)}, ${JSON.stringify(Object.keys(constants.CATEGORIES))}]`;
    //console.log(result);

    res.end(result);
    await pgClient.end();
};

const submitRideEvent = async function(dcClient, args, res) {
    var pgClient = pg.getNewClient();
    await pgClient.connect();


    var validateQuery = 'SELECT * from validateState($1)';
    const pgResponse = await pgClient.query(validateQuery, [args.stateID]);
    var valid =  pgResponse.rows[0];
    if(!valid["isvalid"]) {
        res.writeHead(422, {'Content-Type': 'application/json'});
        res.end('{"error:" "Invalid state! Please genereate a new link using the discord commands"}');
        Logger.logDebug("Ride form submitted with invalid state!");
        return;
    }	
				
    //Fill in extra info needed for RideEvent Creation
	args['payment'] = args['payment'] == 'on';
	Logger.logDebug("Attempting to create time " + args['whenRaw'] + " in timezone " + args['tz']);
	args['when'] = moment.tz(args['whenRaw'], args['tz']).valueOf();
	Logger.logDebug(args['when']);
	args['timestamp'] = Date.now();
    args['target'] = await dcClient.users.fetch(valid['did']);

	//Determine the category
	var rideLat = args.dest.lat;
	var rideLon = args.dest.lon;
	var curCat = "Everywhere Else";
    var curCatID = constants.EVERYWHERE_ELSE_CHANNEL_ID;
	var curCatPriority = -1;
	for (const category in constants.CATEGORIES){
		var c = constants.CATEGORIES[category];
		for(var i = 0; i < c.coordinates.length; i++){ //Categories can have multiple points
			Logger.logDebug(`Dist from category ${category} (Priority: ${c.priority}, ID: ${c.channel}) is ${getDistance(rideLat, rideLon, c.coordinates[i][1], c.coordinates[i][0])}`)
			if(getDistance(rideLat, rideLon, c.coordinates[i][1], c.coordinates[i][0]) < c.radius && c.priority > curCatPriority){
				Logger.logDebug("Found a matching category!");
				curCat = category;
				curCatID = c.channel;
				curCatPriority = c.priority;
			}
		}
	}
	args["cat"] = curCat;

    //Create a new RideEvent from the data we recieved
	var re;
	Logger.logDebug("Recieve data for ride type: " + args.isOffer ? "Offer" : "Request");
	if(!args.isOffer) {
		re = new Request(args);
	} else {
		re = new Offer(args);
	}
	Logger.logDebug(re);

    //Send the ride message
	var messageResult = await re.sendRideMessage(dcClient, curCatID);
	if(re.message == null) {
		Logger.logError("Error while processing ");
		Logger.logError("Message did not send for some reason!");
	}
    Logger.logDebug(messageResult);
	if(args.urgent) {
		const message = re.writeUpdateText();
		const update = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(":rotating_light: Urgent Request :rotating_light:")
			.addFields({name: "Details:", value: message}, {name: "Additional Info:", value: (re.info ?? "None")});
		var channel = await dcClient.channels.fetch(constants.UPDATE_CHANNEL_ID);
		channel.send({content: "<@&1027782166811254805>", embeds: [update]});
	}

    //Send the controls
    var controlsId = await re.sendControls(dcClient);

    //Store the new RideEvent in the database
    var q = "call newride($1::varchar(200), to_timestamp($2 / 1000.0)::timestamp, $3::varchar(200), to_timestamp($4 / 1000.0)::timestamp, $5::bool, $6::varchar(200), $7::bigint, $8::bigint, $9::bigint, $10::bigint, $11::varchar(200), $12::varchar(200), $13::varchar(200), $14::numeric, $15::numeric, $16::varchar(200), $17::varchar(200), $18::varchar(200), $19::numeric, $20::numeric, $21::varchar(200), $22::varchar(32), $23::varchar(32), $24::bigint, $25::bool, $26::varchar(200), $27::bool);";
    var pgArgs = [args.cat, args.when, args.status ?? "", args.timestamp, args.payment, args.info, messageResult.id, messageResult.guildId, messageResult.channelId, controlsId, args.whence.name, args.whence.display_name, args.whence.type, args.whence.lat, args.whence.lon, args.dest.name, args.dest.display_name, args.dest.type, args.dest.lat, args.dest.lon, args.target.avatarURL(), args.target.tag, args.target.globalName, args.target.id, args.isOffer, args.vehicleInfo, args.urgent ?? false];
    Logger.logDebug(pgArgs);
    const pgResult = await pgClient.query(q, pgArgs);
	res.writeHead(201, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({status: 'Success'}));


    //Get all rides from the DB
    var updateQuery = `SELECT * FROM getAllRides()`;
	const response = await pgClient.query(updateQuery);
    var allRequests =  response.rows;
    Logger.logDebug(`Searching through ${allRequests.length} requests to see if any match...`);

    //Loop through to see if any match
    var resultText = "";
    var foundMatch = false;
    for(const ride of allRequests) {
        var destDist = getDistance(args.dest.lat, args.dest.lon, ride.destlat, ride.destlong);
        var origDist = getDistance(args.whence.lat, args.whence.lon, ride.originlat, ride.originlong);
        var timeDifference = Math.abs(args.when - ride.departuretime);
        Logger.logDebug(`Destination Distance ${destDist}mi, Origin Distance: ${origDist}mi, Time Difference: ${timeDifference}ms, ${args.cat}=${ride.cat}?: ${args.cat == ride.cat}`);
        if(destDist < 2 && origDist < 2 && timeDifference < 7200000 && args.cat == ride.cat) {//need to change this 
            //ping the creater of ride 
            Logger.logDebug("Found a match!");
            foundMatch = true;
            resultText += `<@${ride.uid}> this ride offer looks like it matches your request for ${args.dest.name}.\n`; // ${Offer.genRideLink(ride.messageid, ride.channelid, ride.guildid)}
            break;
        }
    }

    //If we found a match, let's alert the person who sent the request
    if(foundMatch) {
        var channel = await dcClient.channels.fetch(curCatID);
		channel.send(resultText);
    }

    
    await pgClient.end();
};

//Stack overflow code for coordinates
function getDistance(lat1, lon1, lat2, lon2) {
    var R = 3958.8; // Radius of the earth in miles
    var d = R * Math.acos(Math.sin(deg2rad(lat1)) * Math.sin(deg2rad(lat2)) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.cos(deg2rad(lon1 - lon2)));
    return d;
  }
  
  function deg2rad(deg) {
    return deg * (Math.PI/180);
  }
  
  function rad2deg(rad) {
      return (rad * 180)/Math.PI;
  }

module.exports = {
    getLoginInfo,
    getRidesByUser,
    userInServer,
    submitRideEvent,
    viewSingleRide,
    editRides, 
    search
};