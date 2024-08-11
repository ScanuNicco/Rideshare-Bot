create or replace function getRidesByUser (discordidarg bigint) --get a list of rideEvents for a specific user
	returns table (
		id					int,
		category 			varchar(200),
		departureTime		timestamp,
		status				varchar(200),
		createdTime			timestamp,
		payment				bool,
		info				varchar(200),
		originname			varchar(200),
		destinname			varchar(200),
		canceled			bool
	)
	language plpgsql
	as
$$
declare
begin
	return query select re.id, cat as category, re.departuretime as departureTime, ridestatus as status, re.createdTime as createdTime, ridepayment as payment, rideinfo as info, origin.lname as originname, dest.lname as destinname, re.canceled
	from rideevent re join ridelocation dest on re.destinlocation = dest.id
	join ridelocation origin on re.originlocation = origin.id
	where re.userid = getuserid(discordidarg)
	order by createdTime desc;
end;
$$