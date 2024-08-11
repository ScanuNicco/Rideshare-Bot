create or replace function getuserid(discordidarg bigint) --create a new State for a given user
	returns int
	language plpgsql
	as
$$
declare
	declare userid int;
begin
	if discordidarg is null then --check for null arguments
		raise exception 'No Nulls!';
	end if;

	select id into userid --fetch the internal id for the user
	from discorduser d 
	where d.discordid = discordidarg;

	return userid;
end;
$$