-- Profile photos for barbers / artists / crew. Soft-remove stays on available.
alter table team_members add column if not exists image text;
