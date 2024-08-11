do $$

declare dbname varchar(200) := 'testDB';

begin
-- Creates the DB application bot and sets their permissions
create user ridesharebot with password 'vroom';
grant execute on procedures to ridesharebot;
grant execute on functions to ridesharebot;

end $$;