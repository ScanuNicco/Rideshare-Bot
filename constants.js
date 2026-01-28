exports.UPDATE_CHANNEL_ID = "1043644962941702244"; //Channel ID where daily updates are sent
exports.VERSION = "2.0"; //Bot Version Number
exports.VERBOSE = true; //Print extra info for debugging. This should be set to false for production environments
exports.HOSTNAME = "http://localhost:8081/"; //Where is the bot hosted. This should be in the form of https://example.com/
exports.CATEGORIES = { //Each one contains center coordinates, a radius that includes that category, a Discord Channel ID, and a priority
    "Chicago": {
        "channel": '1027318092910567554',
        "coordinates": [
            [
                -87.6244212,
                41.8755616
            ]
        ],
        "priority": 1, //Priority allows Indy Airport to take precedence of Indy, for example
        "radius": 20 //Calculated using stack overflow code that does a bunch of confusing trig crap. Distance in miles.
    },
    "Chicago Airports": {
        "channel": '1037080082117828648',
        "coordinates": [ //For categories with multiple points, being withing the radius of either point will cause the ride to be in the category
            [
                -87.90917993412859,
                41.977984899999996
            ],
            [
                -87.7508277936727,
                41.78544375
            ]
        ],
        "priority": 2,
        "radius": 3
    },
    "Indianapolis": {
        "channel": '1027318043753328711',
        "coordinates": [
            [
                -86.1583502,
                39.7683331
            ]
        ],
        "priority": 1,
        "radius": 20
    },
    "Indianapolis Airport": {
        "channel": '1027318128906076182',
        "coordinates": [
            [
                -86.29508388539975,
                39.7162533
            ]
        ],
        "priority": 2,
        "radius": 3
    },
    "Local": {
        "channel": '1027324574548893776',
        "coordinates": [
            [
                -87.32415823743071,
                39.482920050000004
            ]
        ],
        "priority": 1,
        "radius": 20
    },
    "Everywhere Else": { //Radius is large enough to cover the entire planet, but priority is low so any other matching category will override.
        "channel": '1027318188096098324',
        "coordinates": [
             [
                0,
                -90
            ]
        ],
        "priority": 0,
        "radius": 15000
    },
    "Bot Test": { //Anything in Antarctica goes in bot test.
        "channel": '1043297507779809290',
        "coordinates": [
             [
                0,
                -90
            ]
        ],
        "priority": 1,
        "radius": 2000
    }
};
exports.BUTTONS_CHANNEL_ID = '1068572338360156231'; //What channel should the "create new ride" buttons be sent in
