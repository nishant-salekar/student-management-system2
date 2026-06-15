
-- Tighten RLS: require authenticated user
DROP POLICY IF EXISTS "Authenticated users can insert students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can update students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can delete students" ON public.students;

CREATE POLICY "Authenticated users can insert students"
  ON public.students FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update students"
  ON public.students FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete students"
  ON public.students FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Lock down SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.log_student_activity() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_admission_no() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Storage policies for student-photos bucket
CREATE POLICY "Authenticated read student photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'student-photos');
CREATE POLICY "Authenticated upload student photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'student-photos');
CREATE POLICY "Authenticated update student photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'student-photos');
CREATE POLICY "Authenticated delete student photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'student-photos');
