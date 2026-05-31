-- Rename track slug after Computational Biomechanics → ML in Proteins rebrand.

update public.csot_registrations
set track_slug = 'ml-in-proteins'
where track_slug = 'computational-biomechanics';
