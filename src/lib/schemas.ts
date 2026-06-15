import { z } from "zod";

export const studentSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(100),
  course: z.string().trim().min(2, "Course is required").max(100),
  year: z.coerce.number().int().min(1).max(6),
  dob: z.string().min(1, "Date of birth is required"),
  email: z.string().trim().email("Invalid email").max(255),
  mobile: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{7,20}$/, "Invalid mobile number"),
  gender: z.enum(["Male", "Female", "Other"]),
  address: z.string().trim().min(5, "Address is too short").max(500),
  photo_url: z.string().url().optional().nullable().or(z.literal("")),
});

export type StudentInput = z.infer<typeof studentSchema>;

export const COURSES = [
  "B.Tech Computer Engineering",
  "B.Tech IT",
  "B.Tech Mechanical",
  "B.Tech Civil",
  "B.Tech Electronics",
  "MBA",
  "MCA",
  "BBA",
  "BCA",
  "B.Sc IT",
  "B.Pharm",
  "B.Arch",
];
