drop function if exists findLocation;
create or replace function findLocation ( -- returns the location id for a location with given properties. Creates a new one if it does not exits
	locname varchar(200),
	loclabel varchar(200),
	loctype varchar(200),
	loclat numeric,
	loclong numeric
)
returns int
language plpgsql
as $$
declare exist int;
begin 
	-- Finds or Creates a  location
	select id into exist 
	from ridelocation 
	where lname = locname 
	and llabel = loclabel 
	and ltype = loctype 
	and lat = loclat 
	and long = loclong;

	if exist is null
	then
		insert into ridelocation (lname, llabel, ltype, lat, long) values (locname, loclabel, loctype, loclat, loclong) returning id into exist;
	end if;
	return exist;
end
$$