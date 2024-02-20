create or replace function viewRides(rideID int)
	returns table (
	depTime timestamp,
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
	isOffer boolean,
	info varchar(200),
	creatTime timestamp,
	payment bool,
	veInfo varchar(200),
	urgent boolean, 
	cat varchar(200),
	status varchar(200))
	language plpgsql
as $function$
declare 
begin
	return query select ridetime as depTime, 
	origin.lname as oname, origin.llabel as olabel, origin.ltype as otype, origin.lat as olat, origin.long as olong,
	dest.lname as dname, dest.llabel as dlabel, dest.ltype as dtype, dest.lat as dlat, dest.long as dlong, 
	rr.eventid is null as isOffer, re.rideInfo as info, re.rideTimestamp as createTime, re.ridePayment as payment, 
	ro.vehicleInfo as veInfo, rr.isUrgent as urgent, re.cat as cat,re.ridestatus as status
	from rideevent re join ridelocation dest on re.originlocation = dest.id
	join ridelocation origin on re.destinlocation = origin.id
	left join rideoffer ro on ro.eventid = re.id
	left join riderequest rr on rr.eventid = re.id
	where re.ID = rideID
	order by re.ridetimestamp desc;
	
end; $function$
