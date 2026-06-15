
-- Sequence for admission numbers
CREATE SEQUENCE IF NOT EXISTS public.admission_no_seq START 1;

-- Function to generate admission number: PU-YYYY-0001
CREATE OR REPLACE FUNCTION public.generate_admission_no()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  next_val BIGINT;
BEGIN
  next_val := nextval('public.admission_no_seq');
  RETURN 'PU-' || to_char(now(), 'YYYY') || '-' || lpad(next_val::text, 4, '0');
END;
$$;

-- Students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_no TEXT NOT NULL UNIQUE DEFAULT public.generate_admission_no(),
  name TEXT NOT NULL,
  course TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 6),
  dob DATE NOT NULL,
  email TEXT NOT NULL UNIQUE,
  mobile TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('Male','Female','Other')),
  address TEXT NOT NULL,
  photo_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_students_name ON public.students (lower(name));
CREATE INDEX idx_students_course ON public.students (course);
CREATE INDEX idx_students_email ON public.students (lower(email));
CREATE INDEX idx_students_admission_no ON public.students (admission_no);
CREATE INDEX idx_students_created_at ON public.students (created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all students"
  ON public.students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert students"
  ON public.students FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update students"
  ON public.students FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete students"
  ON public.students FOR DELETE TO authenticated USING (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Activity log
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID,
  admission_no TEXT,
  action TEXT NOT NULL CHECK (action IN ('CREATE','UPDATE','DELETE')),
  actor_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_log_created_at ON public.activity_log (created_at DESC);
CREATE INDEX idx_activity_log_student ON public.activity_log (student_id);

GRANT SELECT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view activity"
  ON public.activity_log FOR SELECT TO authenticated USING (true);

-- Activity trigger
CREATE OR REPLACE FUNCTION public.log_student_activity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_log (student_id, admission_no, action, actor_id, details)
    VALUES (NEW.id, NEW.admission_no, 'CREATE', auth.uid(), jsonb_build_object('name', NEW.name, 'course', NEW.course));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.activity_log (student_id, admission_no, action, actor_id, details)
    VALUES (NEW.id, NEW.admission_no, 'UPDATE', auth.uid(), jsonb_build_object('name', NEW.name, 'course', NEW.course));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.activity_log (student_id, admission_no, action, actor_id, details)
    VALUES (OLD.id, OLD.admission_no, 'DELETE', auth.uid(), jsonb_build_object('name', OLD.name, 'course', OLD.course));
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;

CREATE TRIGGER trg_students_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.log_student_activity();
