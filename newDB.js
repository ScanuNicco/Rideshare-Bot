var pg = require('pg');
var fs = require('fs');
require('dotenv').config();
const { argv } = require('node:process');

async function deployDB() {

    if(process.argv.length != 4) {
        console.log("Usage: deploy-database.js [Admin Username] [Admin Password]");
        console.log("Note: This process needs the credentails to a postgres user with permission to create databases and other users. It will create an application account with the credentials you provide in .env")
        return;
    }

    const username = process.argv[2];
    const pw = process.argv[3];
    console.log(pw);

    console.log("Initializing...");
    var postgres = new pg.Client({
        host: process.env.PG_HOST,
        port: process.env.PG_PORT,
        user: username,
        password: pw,
        database: 'postgres',
        ssl: {
            sslmode: 'require',
            rejectUnauthorized: false
        }});
    await postgres.connect();
    console.log("Connected to PostgreSQL as " + username);

    console.log("Creating Database " + process.env.PG_DATABASE + "...");
    await postgres.query(`create database ${process.env.PG_DATABASE};`);
    console.log("Database Created Sucessfully");

    await postgres.end(); //End the client for the postgres DB
    var newDB = new pg.Client({
        host: process.env.PG_HOST,
        port: process.env.PG_PORT,
        user: username,
        password: pw,
        database: process.env.PG_DATABASE,
        ssl: {
            sslmode: 'require',
            rejectUnauthorized: false
        }});
    await newDB.connect(); //Create the client for the new DB
    console.log("Connected to database " + process.env.PG_DATABASE);

    console.log("Deploying tables & stored procedures...");
    var filenames = [
        "createAllTables.sql",
        "cancelRide.sql",
        "createState.sql",
        "createUpdateUser.sql",
        "editRides.sql",
        "findLocation.sql",
        "getDailyUpdate.sql",
        "getRideByID.sql",
        "getRideByPanelID.sql",
        "getRidesByUser.sql",
        "getUserId.sql",
        "newRide.sql",
        "searchRides.sql",
        "setStatus.sql",
        "validateState.sql",
        "viewAllRides.sql",
        "viewRides.sql",
        "createIndicies.sql"
    ];

    for (filename of filenames){
        console.log("Running " + filename + "...");
        var sql = fs.readFileSync(__dirname + "/SQL/" + filename).toString();

        const result = await newDB.query(sql);
    }

    console.log("Deploying database user...");

    var userQuery = `do $$ \ndeclare dbname varchar(200) := '${process.env.PG_DATABASE}';\n begin \ncreate user ${process.env.PG_USER} with password '${process.env.PG_PASSWORD}';\n GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO ${process.env.PG_USER};\nGRANT EXECUTE ON ALL PROCEDURES IN SCHEMA public TO ${process.env.PG_USER};\n GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${process.env.PG_USER};\nGRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${process.env.PG_USER};\n end $$`;
    console.log(userQuery);                                                                                                                                                        
    await newDB.query(userQuery);

    console.log("Database Deployed!");
    await newDB.end();
}

deployDB();