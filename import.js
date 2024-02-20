const { Client } = require('pg');
require('dotenv').config();
var LocalStorage = require('node-localstorage').LocalStorage;
const localStorage = new LocalStorage('./ridedata');
var rides = JSON.parse(localStorage.getItem('rides')) ?? {};
var requests = JSON.parse(localStorage.getItem('requests')) ?? {};

(async () => {
  const client = new Client({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    ssl: false,
  });
  await client.connect();
  const res = await client.query('SELECT $1::text as connected', ['Connection to postgres successful!']);
  console.log(res.rows[0].connected);
  for(let key in rides){
    var re = rides[key];
    var q = `call newride('${re.cat}'::varchar(200), to_timestamp(${re.when} / 1000.0)::timestamp, '${sanitize(re.status)}'::varchar(200), to_timestamp(${re.timestamp} / 1000.0)::timestamp, ${re.payment}, '${sanitize(re.info)}'::varchar(200), ${re.message.id}, ${re.message.guildId}, ${re.message.channelId}, ${key}, '${sanitize(re.whence.properties.geocoding.name)}'::varchar(200), '${sanitize(re.whence.properties.geocoding.label)}'::varchar(200), '${re.whence.properties.geocoding.type}'::varchar(200), ${re.whence.geometry.coordinates[1]}::numeric, ${re.whence.geometry.coordinates[0]}::numeric, '${sanitize(re.dest.properties.geocoding.name)}'::varchar(200), '${sanitize(re.dest.properties.geocoding.label)}'::varchar(200), '${re.dest.properties.geocoding.type}'::varchar(200), ${re.dest.geometry.coordinates[1]}::numeric, ${re.dest.geometry.coordinates[0]}::numeric, '${re.target.avatarURL}'::varchar(200), '${re.target.tag}'::varchar(32), '${re.target.globalName ?? re.target.username}'::varchar(32), ${re.target.id}, true, '${sanitize(re.vehicleInfo ?? "")}'::varchar(200), false);`;
    console.log(q);
    const res = await client.query(q);
  }
  console.log(`Inserted Rides`);
  for(let key in requests){
    var re = requests[key];
    var q = `call newride('${re.cat}'::varchar(200), to_timestamp(${re.when} / 1000.0)::timestamp, '${sanitize(re.status)}'::varchar(200), to_timestamp(${re.timestamp} / 1000.0)::timestamp, ${re.payment}, '${sanitize(re.info)}'::varchar(200), ${re.message.id}, ${re.message.guildId}, ${re.message.channelId}, ${key}, '${sanitize(re.whence.properties.geocoding.name)}'::varchar(200), '${sanitize(re.whence.properties.geocoding.label)}'::varchar(200), '${re.whence.properties.geocoding.type}'::varchar(200), ${re.whence.geometry.coordinates[1]}::numeric, ${re.whence.geometry.coordinates[0]}::numeric, '${sanitize(re.dest.properties.geocoding.name)}'::varchar(200), '${sanitize(re.dest.properties.geocoding.label)}'::varchar(200), '${re.dest.properties.geocoding.type}'::varchar(200), ${re.dest.geometry.coordinates[1]}::numeric, ${re.dest.geometry.coordinates[0]}::numeric, '${re.target.avatarURL}'::varchar(200), '${re.target.tag}'::varchar(32), '${re.target.globalName ?? re.target.username}'::varchar(32), ${re.target.id}, false, '${sanitize(re.vehicleInfo ?? "")}'::varchar(200), false);`;
    console.log(q);
    const res = await client.query(q);
  }
  console.log(`Inserted Requests`);
  await client.end();
})();

function sanitize(str) {
    return str.replaceAll("'", "&apos;");
}
