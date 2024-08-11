create or replace function validateState (stateid uuid) --check if a given state id is valid for a user
	returns table (
		isValid bool,
		dID	bigint
	)
	language plpgsql
	as
$$
declare
	declare stateExp		timestamp;
	declare useridtmp		int;
	declare discordidtmp	bigint;
begin
	if stateid is null then --check for null arguments
		raise exception 'No Nulls!';
	end if;
	
	select posttimestamp, userid into stateExp, useridtmp --fetch the internal id for the state
	from state s
	where s.guid = stateid;
	
	if stateExp < NOW() or stateExp is null then
		return query select false as isValid, 0::bigint as did;
	else
		select discordid into discordidtmp --fetch the internal id for the user
		from discorduser d 
		where d.id = useridtmp;
		return query select true as isValid, discordidtmp as did;
	end if;
end;
$$