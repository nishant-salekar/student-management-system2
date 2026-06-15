import { useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { studentSchema, type StudentInput, COURSES } from "@/lib/schemas";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

export type StudentRecord = StudentInput & { id?: string; admission_no?: string; photo_path?: string | null };

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: StudentRecord | null;
  onSaved: () => void;
}

export function StudentDialog({ open, onOpenChange, initial, onSaved }: Props) {
  const isEdit = !!initial?.id;
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, control, setValue, watch, reset, formState: { errors } } = useForm<StudentInput>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: initial?.name ?? "",
      course: initial?.course ?? "",
      year: initial?.year ?? 1,
      dob: initial?.dob ?? "",
      email: initial?.email ?? "",
      mobile: initial?.mobile ?? "",
      gender: (initial?.gender as any) ?? "Male",
      address: initial?.address ?? "",
      photo_url: initial?.photo_url ?? "",
    },
  });

  const photoUrl = watch("photo_url");

  const handleFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("student-photos").upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = await supabase.storage.from("student-photos").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
      if (!data?.signedUrl) throw new Error("Failed to generate URL");
      setValue("photo_url", data.signedUrl, { shouldValidate: true });
      toast.success("Photo uploaded");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: StudentInput) => {
    setSubmitting(true);
    try {
      const payload = { ...values, photo_url: values.photo_url || null };
      if (isEdit) {
        const { error } = await supabase.from("students").update(payload).eq("id", initial!.id!);
        if (error) throw error;
        toast.success("Student updated");
      } else {
        const { error } = await supabase.from("students").insert(payload);
        if (error) throw error;
        toast.success("Student added");
      }
      reset();
      onOpenChange(false);
      onSaved();
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {isEdit ? `Edit Student · ${initial?.admission_no}` : "Add New Student"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={photoUrl || undefined} />
              <AvatarFallback className="bg-secondary text-secondary-foreground">PHOTO</AvatarFallback>
            </Avatar>
            <div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Upload Photo
              </Button>
              <p className="text-xs text-muted-foreground mt-1">JPG / PNG, max 5MB</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Full Name *" error={errors.name?.message}>
              <Input {...register("name")} />
            </Field>
            <Field label="Email *" error={errors.email?.message}>
              <Input type="email" {...register("email")} />
            </Field>
            <Field label="Course *" error={errors.course?.message}>
              <Controller control={control} name="course" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>{COURSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </Field>
            <Field label="Year *" error={errors.year?.message}>
              <Controller control={control} name="year" render={({ field }) => (
                <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{[1,2,3,4,5,6].map(y => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </Field>
            <Field label="Date of Birth *" error={errors.dob?.message}>
              <Input type="date" {...register("dob")} />
            </Field>
            <Field label="Mobile *" error={errors.mobile?.message}>
              <Input {...register("mobile")} placeholder="+91 98765 43210" />
            </Field>
            <Field label="Gender *" error={errors.gender?.message}>
              <Controller control={control} name="gender" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </Field>
          </div>

          <Field label="Address *" error={errors.address?.message}>
            <Textarea rows={3} {...register("address")} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? "Save changes" : "Add Student"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
