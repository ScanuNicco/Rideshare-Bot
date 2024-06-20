create table DiscordUser (
	ID 					serial,
	avatarURL			varchar(200),
	username 			varchar(32) unique,
	displayName			varchar(32),
	discordID			bigint unique,
	primary key 		(ID)
);

create table State (
	GUID				uuid default gen_random_uuid(),
	postTimestamp		timestamp,
	userID				int,
	primary key 		(GUID),
	foreign key			(userID) references DiscordUser (ID)
);

create table DiscordMessage (
	ID 					serial,
	dMessageID			bigint,
	dguildID			bigint,
	dChannelID			bigint,
	controlpanel		bigint,
	primary key 		(ID)
);

create table RideLocation (
	ID					serial,
	lName				varchar(200),
	lLabel				varchar(200),			
	lType				varchar(200),
	Lat					numeric,
	Long				numeric,
	primary key 		(ID)
);

create table RideEvent(
	ID					serial primary key,
	cat					varchar(200),
	departureTime		timestamp, --departure time
	rideStatus			varchar(40),
	createdTime		    timestamp,
	ridePayment			bool,
	rideInfo			varchar(200),
	MessageID			int,
	originLocation		int,
	destinLocation		int,
	userID 				int,
	canceled			bool,
	foreign key (userID) references DiscordUser(ID),
	foreign key(MessageID) references DiscordMessage(ID),
	foreign key(originLocation) references RideLocation(ID),
	foreign key(destinLocation) references RideLocation(ID)
);

create table RideOffer(
	eventID 			int primary key,
	vehicleInfo			varchar(100),
	foreign key(eventID) references RideEvent(ID)
);

create table RideRequest(
	eventID 			int primary key,
	isUrgent			boolean,
	foreign key(eventID) references RideEvent(ID)
)