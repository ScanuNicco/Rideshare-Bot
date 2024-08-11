--------------------------------------------------
-- Purpose:
-- Creates a New Ride Event
--------------------------------------------------
-- Demo:
-- DECLARE @Status int
-- EXEC @Status = newRide ()
-- SELECT Status = @Status
--------------------------------------------------
-- Revision History:
-- Created - Noah Shuler - 1/17/2024
--------------------------------------------------

create or replace procedure newRide (
	cat varchar(200),
	departureTime timestamp,
	ridestatus varchar(200),
	createdTime timestamp,
	ridepayment bool,
	rideinfo varchar(200),
	
	dmessageid bigint,
	dguildid bigint,
	dchannelid bigint,
	controlpanel bigint,
	
	oname varchar(200),
	olabel varchar(200),
	otype varchar(200),
	olat numeric,
	olong numeric,
	
	dname varchar(200),
	dlabel varchar(200),
	dtype varchar(200),
	dlat numeric,
	dlong numeric,
	
	avatarurlarg varchar(200),
	usernamearg varchar(32),
	displaynamearg varchar(32),
	discordidarg bigint,
	
	offerorrequest bool,
	vehicleinfo varchar(200),
	isurgent bool)
language plpgsql
as $$

declare exist int;
declare messageid int;
declare originlocation int;
declare destinlocation int;
declare userid int;
declare rideid int;

begin

-- Ensures No Null Arguements
if (cat is null or
	departureTime is null or
	ridestatus is null or
	createdTime is null or
	ridepayment is null or
	rideinfo is null or
	dmessageid is null or
	dguildid is null or
	dchannelid is null or
	oname is null or
	olabel is null or
	otype is null or
	olat is null or
	olong is null or
	dname is null or
	dlabel is null or
	dtype is null or
	dlat is null or
	dlong is null or
	avatarurlarg is null or
	usernamearg is null or
	displaynamearg is null or
	discordidarg is null or
	offerorrequest is null)
then
	raise exception 'No Null Arguements!';
end if;

-- Ensures No Null in Ride Types
if (offerorrequest is true)
then
	if (vehicleinfo is null)
	then
		raise exception 'No Null Arguements!';
	end if;
else
	if (isurgent is null)
	then
		raise exception 'No Null Arguements!';
	end if;
end if;

-- Creates a discordmessage
insert into discordmessage (dmessageid, dguildid, dchannelid, controlpanel) values (dmessageid, dguildid, dchannelid, controlpanel) returning id into messageid;

-- Find or Create an Origin and Destination locations
select findlocation(oname, olabel, otype, olat, olong) into originlocation;
select findlocation(dname, dlabel, dtype, dlat, dlong) into destinlocation;


-- Finds and Updates or Creates a discorduser
call upsertuser(discordidarg, displaynamearg, usernamearg, avatarurlarg);
select getuserid(discordidarg) into userid;

-- Creates a rideevent
insert into rideevent (cat, departureTime, ridestatus, createdTime, ridepayment, rideinfo, messageid, originlocation, destinlocation, userid, canceled)
values (cat, departureTime, ridestatus, createdTime, ridepayment, rideinfo, messageid, originlocation, destinlocation, userid, false) returning id into rideid;

-- Determine Ride Type
if (offerorrequest is true)
then
	insert into rideoffer (eventid, vehicleinfo) values (rideid, vehicleinfo);
else
	insert into riderequest (eventid, isurgent) values (rideid, isurgent);
end if;

end
$$;
