create or replace procedure setStatus(rideid int, statusarg varchar(200))
language plpgsql
as $$
begin 
	update rideevent 
	set ridestatus = statusarg 
	where id = rideid;
end
$$