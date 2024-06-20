--------------------------------------------------
-- Purpose:
-- Gets all information for a ride given its id
--------------------------------------------------
-- Demo:
-- DECLARE @Status int
-- EXEC @Status = newRide ()
-- SELECT Status = @Status
--------------------------------------------------
-- Revision History:
-- Created - Nicco Scanu - 2/7/2024
--------------------------------------------------
drop function if exists getRideByPanelID;
create or replace function getRideByPanelID(panelid bigint)
returns table (
	cat varchar(200),
	"when" timestamp,
	status varchar(200),
	"timestamp" timestamp, 
	payment bool,
	info varchar(200),
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
	duserid bigint,
	vehicleinfo varchar(200),
	isurgent bool,
	isoffer bool,
	rideid int,
	deleted bool)
language plpgsql
as $function$
declare
begin
		return query
		select 
			r.cat as cat,
			r.departureTime as "when",
			r.ridestatus as status,
			r.createdTime as "timestamp", 
			r.ridepayment as payment,
			r.rideinfo as info,
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
			du.discordid as duserid,
			ro.vehicleinfo as vehicleinfo,
			rr.isurgent as isurgent,
			rr.eventid is null as isoffer,
			r.id as rideid,
			r.canceled as deleted
		from rideevent as r
		join discordmessage as dm on dm.id = r.messageid
		join ridelocation as ol on ol.id = r.originlocation
		join ridelocation as dl on dl.id = r.destinlocation
		join discorduser as du on du.id = r.userid
		left join rideoffer as ro on ro.eventid = r.id
		left join riderequest as rr on rr.eventid = r.id
		where dm.controlpanel = panelid;
end;
$function$