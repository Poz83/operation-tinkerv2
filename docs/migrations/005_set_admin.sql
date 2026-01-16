-- Ensure Jamie is an admin
UPDATE public.users
SET is_admin = TRUE, is_whitelisted = TRUE
WHERE email = 'jamie@myjoe.app';
