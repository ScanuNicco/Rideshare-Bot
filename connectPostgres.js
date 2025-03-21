const pg = require('pg');
require('dotenv').config();

const getNewClient = function(){
    return new pg.Client({
        host: process.env.PG_HOST,
        port: process.env.PG_PORT,
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        database: process.env.PG_DATABASE,
        ssl: false/*{
            sslmode: 'require',
            rejectUnauthorized: false
        }*/,
    });
}

module.exports = {
    getNewClient
}