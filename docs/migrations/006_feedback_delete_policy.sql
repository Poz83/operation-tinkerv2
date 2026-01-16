-- Allow admins to delete feedback
DROP POLICY IF EXISTS "Admins can delete feedback" ON public.feedback;

CREATE POLICY "Admins can delete feedback" ON public.feedback
FOR DELETE
USING (
  exists (
    select 1 from public.users
    where users.id = auth.uid()
    and users.is_admin = true
  )
);

-- Ensure admins can also update feedback status (if not already covered)
DROP POLICY IF EXISTS "Admins can update feedback" ON public.feedback;

CREATE POLICY "Admins can update feedback" ON public.feedback
FOR UPDATE
USING (
  exists (
    select 1 from public.users
    where users.id = auth.uid()
    and users.is_admin = true
  )
);
