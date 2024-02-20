create or replace procedure editRides(
--edit the corresponding ride event, must be verified in the viewride page
	rideID int, 
	depTime timestamp,
	veInfo varchar(100),
	info varchar(200),
	isoffer boolean,
	status varchar(200),
	
	oname varchar(200),
	olabel varchar(200),
	otype varchar(200),
	olat numeric,
	olong numeric,
	
	dname varchar(200),
	dlabel varchar(200),
	dtype varchar(200),
	dlat numeric,
	dlong numeric
)
language plpgsql
as $$
BEGIN
	
	-- Ensures No Null Arguements
	if (rideID is null or
		depTime is null or
		status is null or
		info is null or
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
		isoffer is null)
	then
		raise exception 'No Null Arguements!';
	end if;

	if (isoffer is true)
	then -- This is a ride offer, so it needs to supply a vehicle info
		if (veInfo is null)
		then
			raise exception 'No Null Arguements!';
		else
			update rideoffer set vehicleInfo = veInfo where eventID = rideID;
		end if;
	
	end if;
	
	update rideevent
	set rideInfo = info, ridetime = depTime, ridestatus = status, originlocation = findlocation(oname, olabel, otype, olat, olong), destinlocation = findlocation(dname, dlabel, dtype, dlat, dlong)
	where ID = rideID;
	
	if veInfo is not null then
		
	end if;
	
	raise notice 'SUCCESSFULLY UPDATED DATABASE';
	
end; $$