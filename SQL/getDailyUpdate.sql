create or replace function getDailyUpdate() --There is no technical reason this couldn't be a view, but the project requires us to only call stored procedures from the front end
	returns table (
		departureTime		timestamp,
		originname			varchar(200),
		destinname			varchar(200),
		displayname			varchar(32),
		isoffer				bool,
		guildid				bigint,
		channelid			bigint,
		messageid			bigint
	)
	language plpgsql
	as
$$
declare
begin
	return query select ridetime as departureTime, origin.lname as originname, dest.lname as destinname, u.displayname, rr.eventid is null as isoffer, d.dmessageid as messageid, d.dchannelid as channelid, d.dguildid as dguildid 
	from rideevent re join ridelocation dest on re.originlocation = dest.id
	join ridelocation origin on re.destinlocation = origin.id
	join discordmessage d on d.id = re.messageid
	join discorduser u on u.id = re.userid
	left join rideoffer ro on ro.eventid = re.id
	left join riderequest rr on rr.eventid = re.id
	where ridetimestamp >= (NOW() - interval '24 Hours');
end;
$$