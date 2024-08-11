-- indicies for foregin keys
create index findexmid on rideevent (messageid);
create index findexol on rideevent (originlocation);
create index findexdl on rideevent (destinlocation);
create index findexuid on rideevent (userid);

create index findexeid on rideoffer (eventid);
create index findexeid2 on riderequest (eventid);

create index findexuid2 on state (userid);

-- indicies on search attributes
create index sindexname on ridelocation (lname);
create index sindexdid on discorduser (discordid);
create index sindexname2 on discorduser (username);
