create or replace procedure cancelRide(rideid int)
language plpgsql
as $$
begin 
	update rideevent 
	set canceled = true 
	where id = rideid;
end
$$