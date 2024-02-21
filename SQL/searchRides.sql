--------------------------------------------------
-- Purpose:
-- Searches Rides based on Location Name
--------------------------------------------------
-- Demo:
-- DECLARE @Status int
-- EXEC @Status = newRide ()
-- SELECT Status = @Status
--------------------------------------------------
-- Revision History:
-- Created - Noah Shuler - 2/7/2024
--------------------------------------------------

create or replace function searchrides (locationtype char(1), locationname varchar(200))
returns table (
	cat varchar(200),
	ridetime timestamp,
	ridestatus varchar(200),
	ridetimestamp timestamp, 
	ridepayment bool,
	rideinfo varchar(200),
	dmessageid bigint,
	dguildid bigint,
	dchannelid bigint,
	controlpanel bigint,
	olname varchar(200),
	ollabel varchar(200),
	oltype varchar(200),
	olat numeric,
	olong numeric,
	dlname varchar(200),
	dllabel varchar(200),
	dltype varchar(200),
	dlat numeric,
	dlong numeric,
	avatarurl varchar(200),
	username varchar(200),
	displayname varchar(200),
	vehicleinfo varchar(200),
	isurgent bool)
language plpgsql
as $function$
declare
begin
	if ($1 = 'd') then
		return query
		select 
			r.cat as cat,
			r.ridetime as ridetime,
			r.ridestatus as ridestatus,
			r.ridetimestamp as ridetimestamp, 
			r.ridepayment as ridepayment,
			r.rideinfo as rideinfo,
			dm.dmessageid as dmessageid,
			dm.dguildid as dguildid,
			dm.dchannelid as dchannelid,
			dm.controlpanel as controlpanel,
			ol.lname as olname,
			ol.llabel as ollabel,
			ol.ltype as oltype,
			ol.lat as olat,
			ol.long as olong,
			dl.lname as dlname,
			dl.llabel as dllabel,
			dl.ltype as dltype,
			dl.lat as dlat,
			dl.long as dlong,
			du.avatarurl as avatarurl,
			du.username as username,
			du.displayname as displayname,
			ro.vehicleinfo as vehicleinfo,
			rr.isurgent as isurgent
		from rideevent as r
		join discordmessage as dm on dm.id = r.messageid
		join ridelocation as ol on ol.id = r.originlocation
		join ridelocation as dl on dl.id = r.destinlocation
		join discorduser as du on du.id = r.userid
		left join rideoffer as ro on ro.eventid = r.id
		left join riderequest as rr on rr.eventid = r.id
		where dl.lname like '%' || $2 || '%' and r.canceled is false;
	elsif ($1 = 'o') then
		return query
		select 
			r.cat as cat,
			r.ridetime as ridetime,
			r.ridestatus as ridestatus,
			r.ridetimestamp as ridetimestamp, 
			r.ridepayment as ridepayment,
			r.rideinfo as rideinfo,
			dm.dmessageid as dmessageid,
			dm.dguildid as dguildid,
			dm.dchannelid as dchannelid,
			dm.controlpanel as controlpanel,
			ol.lname as olname,
			ol.llabel as ollabel,
			ol.ltype as oltype,
			ol.lat as olat,
			ol.long as olong,
			dl.lname as dlname,
			dl.llabel as dllabel,
			dl.ltype as dltype,
			dl.lat as dlat,
			dl.long as dlong,
			du.avatarurl as avatarurl,
			du.username as username,
			du.displayname as displayname,
			ro.vehicleinfo as vehicleinfo,
			rr.isurgent as isurgent
		from rideevent as r
		join discordmessage as dm on dm.id = r.messageid
		join ridelocation as ol on ol.id = r.originlocation
		join ridelocation as dl on dl.id = r.destinlocation
		join discorduser as du on du.id = r.userid
		left join rideoffer as ro on ro.eventid = r.id
		left join riderequest as rr on rr.eventid = r.id
		where ol.lname like '%' || $2 || '%' and r.canceled is false;
	end if;
end;
$function$