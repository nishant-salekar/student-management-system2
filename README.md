# Pillai University — Student Management System

A full-stack Student Management System built for the Pillai University Junior Full Stack Developer task.

## Live demo

LIVE URL : https://build-your-dream-630.lovable.app

## Features

- Add / Edit / Drop students with the following fields: Name, Course, Year, Date of Birth, Email, Mobile, Gender, Address
- **Auto-generated unique Admission Number** in the format `PU-YYYY-NNNN` (database sequence + trigger; unique constraint at the DB level)
- Student photo upload
- View Student List in a paginated, searchable, filterable table
- Search by name / email / admission number
- Filter by course
- Server-side pagination
- Authentication: email/password + Google OAuth

## Tech stack

| Layer        | Choice |
| ------------ | ------ |
| Frontend     | React 19 + TanStack |
| UI           | Tailwind CSS v4 + shadcn/ui |
| Forms        | react-hook-form + zod |
| Backend      | Lovable Cloud (Supabase: PostgreSQL + Auth + Storage) |
| Database     | PostgreSQL (managed)


## REST API endpoints (PostgREST, auto-generated)

The frontend uses the typed `supabase-js` client which calls these under the hood:

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET    | `/rest/v1/students`         | List students (supports `select`, `order`, `limit`, `offset`, `or=`, filters) |
| GET    | `/rest/v1/students?id=eq.X` | Fetch single student |
| POST   | `/rest/v1/students`         | Add student (admission number auto-generated) |
| PATCH  | `/rest/v1/students?id=eq.X` | Update student |
| DELETE | `/rest/v1/students?id=eq.X` | Drop student |
| GET    | `/rest/v1/activity_log`     | Activity log (read-only) |


## Database schema

```sql
CREATE TABLE public.students (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_no  TEXT NOT NULL UNIQUE DEFAULT public.generate_admission_no(),
  name          TEXT NOT NULL,
  course        TEXT NOT NULL,
  year          INTEGER NOT NULL CHECK (year BETWEEN 1 AND 6),
  dob           DATE NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  mobile        TEXT NOT NULL,
  gender        TEXT NOT NULL CHECK (gender IN ('Male','Female','Other')),
  address       TEXT NOT NULL,
  photo_url     TEXT,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`public.generate_admission_no()` reads from `admission_no_seq` to guarantee uniqueness.
A trigger writes to `public.activity_log` on every INSERT/UPDATE/DELETE.

## Local setup

```bash
bun install
bun dev
```

Environment variables (auto-populated by Lovable Cloud):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
```

## Project structure

```
src/
├── routes/
│   ├── __root.tsx                       # Root layout, auth listener, toaster
│   ├── index.tsx                        # Redirects to /students
│   ├── auth.tsx                         # Sign-in / sign-up
│   └── _authenticated/
│       ├── route.tsx                    # Auth gate + sidebar shell
│       ├── students.tsx                 # List + search + filter + paginate + CRUD
│       └── activity.tsx                 # Activity log
├── components/
│   ├── StudentDialog.tsx                # Add/Edit form with photo upload
│   └── ui/                              # shadcn primitives
├── lib/
│   └── schemas.ts                       # Zod validation
└── integrations/supabase/               # Auto-generated client + types
```

## Bonus features implemented

- ✅ Search, filter, server-side pagination
- ✅ Database indexes
- ✅ Activity logging (DB trigger)
- ✅ Environment variables
- ✅ Photo upload to object storage
- ✅ Authentication (email + Google OAuth)
- ✅ Responsive UI

## Submission

- Repo: https://github.com/nishant-salekar/student-management-system2
- Hosted: https://build-your-dream-630.lovable.app
