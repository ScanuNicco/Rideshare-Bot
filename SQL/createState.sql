create or replace function createState(discordidarg bigint) --create a new State for a given user
	returns uuid
	language plpgsql
	as
$$
declare
	declare userid int;
	declare stateid uuid;
begin
	if discordidarg is null then --check for null arguments
		raise exception 'No Nulls!';
	end if;

	select id into userid --fetch the internal id for the user
	from discorduser d 
	where d.discordid = discordidarg;

	if userid is null then
		-- This procedure doesn't have enough information to create a new user. We'll rely on the programmer calling createUpdateUser beforehand
		raise exception 'No user exists with provided id. Did you call createUpdateUser before calling this procedure?';
		
	else
		insert into state (posttimestamp, userid) values (NOW() + interval '1 week', userid) returning guid into stateid; -- The new State will be valid for one week
	end if;
	return stateid;
end;
$$