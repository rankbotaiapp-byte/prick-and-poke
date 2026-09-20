-- Owner-swappable hero behind the public studio page.
alter table businesses add column if not exists hero_image text;
