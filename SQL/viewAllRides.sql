--DROP FUNCTION getallrides(); 

CREATE OR REPLACE FUNCTION getallrides()
 RETURNS TABLE(departuretime timestamp without time zone, originname character varying, destinname character varying, displayname character varying, isoffer boolean, guildid bigint, channelid bigint, messageid bigint, destlat numeric, destlong numeric, originlat numeric, originlong numeric, cat varchar(200), uid int8)
 LANGUAGE plpgsql
AS $function$
declare
begin
	return query select departureTime as departureTime, origin.lname as originname, dest.lname as destinname, u.displayname, rr.eventid is null as isoffer, d.dmessageid as messageid, d.dchannelid as channelid, d.dguildid as dguildid, dest.lat as destlat, dest.long as destlong, origin.lat as originlat, origin.long as originlong, re.cat as cat, u.discordid as uid
	from rideevent re join ridelocation dest on re.destinlocation = dest.id
	join ridelocation origin on re.originlocation = origin.id
	join discordmessage d on d.id = re.messageid
	join discorduser u on u.id = re.userid
	left join rideoffer ro on ro.eventid = re.id
	left join riderequest rr on rr.eventid = re.id
	where departureTime >= now() and rr.eventid is not null;
end;
$function$
;