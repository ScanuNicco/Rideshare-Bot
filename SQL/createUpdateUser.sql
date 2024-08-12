create or replace procedure upsertUser(discordidarg bigint, displaynamearg varchar(32), usernamearg varchar(32), avatarurlarg varchar(200)) --updates a user, or creates them if already exists
   language plpgsql
  as
$$
declare 
-- variable declaration
declare userid int;
begin
 -- logic
	if discordidarg is null or displaynamearg is null or usernamearg is null then
		raise exception 'No Nulls!';
	end if;

	select getuserid(discordidarg) into userid;

	raise notice '%', userid;
	
	if userid > 0 then
		update discorduser set avatarurl = avatarurlarg, username = usernamearg , displayname = displaynamearg
		where discordid = discordidarg;
	else
		-- We now know that we need to create a new user
		insert into discorduser (avatarurl, username, displayname, discordid) values (avatarurlarg, usernamearg, displaynamearg, discordidarg);
	end if;

	
end;
$$