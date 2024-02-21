# Rideshare Bot
A bot to automate the Rose Rideshares Discord server

## Features
* Server members can post Ride Offers and Ride Requests (RideEvents)
* RideEvents can be easily managed through a simple control panel sent to their DMs
* RideEvents will be summarized in Daily Updates posted to a dedicated channel.

## Get Started
### Prerequisites
* Node.JS & NPM
* PostgreSQL Server
* Linux Recommended, but should theoretically run on any platform

### Installation
* Clone this repository
* Open a terminal and navigate to the directory where you cloned the repo
* Run `npm install` to install all required node modules

### Configuration
* Obtain Discord bot credentials via Discord Developers
* Create a file called `.env`
* Choose an account name, password, and database name for Rideshare Bot to use
    * Don't create them on the DB yet
* Fill in the following fields:
```
PG_HOST=[Postgres Server URL (Likely localhost)]
PG_PORT=[Postgres Server Port (Likely 5432)]
PG_USER=[Application account user]
PG_PASSWORD=[Application account password]
PG_DATABASE=[Database name]
TOKEN=[Discord bot token]
CLIENT_ID=[Discord client id]
GUILD_ID=[Discord guild id (1027317839633326140 if Rose Rideshares)]
CLIENT_SECRET=[Discord OAuth client secret]
```
* Run `node newDB.js [PG Admin Account] [PG Admin Password]
    * This command will create set up the database and application account for you
    * It needs an account with full permissions to do so

### Running
* Run `node index.js` to start Rideshare Bot

## Development
* Clone the **fastlane** branch
- Do **not** develop on `main`, or you will be editing the live version of the bot
* Navigate into the cloned directory and run `node index.js`
