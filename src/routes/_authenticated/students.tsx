import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, Edit, Trash2, Users, GraduationCap, UserCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { StudentDialog, type StudentRecord } from "@/components/StudentDialog";
import { COURSES } from "@/lib/schemas";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/students")({
  head: () => ({ meta: [{ title: "Students — Pillai University SMS" }] }),
  component: StudentsPage,
});

const PAGE_SIZE = 10;

function StudentsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StudentRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["students", search, courseFilter, page],
    queryFn: async () => {
      let q = supabase.from("students").select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (search.trim()) {
        const term = `%${search.trim()}%`;
        q = q.or(`name.ilike.${term},email.ilike.${term},admission_no.ilike.${term}`);
      }
      if (courseFilter !== "all") q = q.eq("course", courseFilter);
      const { data, error, count } = await q;
      if (error) throw error;
      return { rows: data ?? [], count: count ?? 0 };
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["student-stats"],
    queryFn: async () => {
      const [{ count: total }, { data: courseAgg }] = await Promise.all([
        supabase.from("students").select("*", { count: "exact", head: true }),
        supabase.from("students").select("course"),
      ]);
      const uniqueCourses = new Set((courseAgg ?? []).map((r: any) => r.course)).size;
      const recent = (courseAgg ?? []).length;
      return { total: total ?? 0, uniqueCourses, recent };
    },
  });

  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));

  const onDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("students").delete().eq("id", deleteId);
    if (error) { toast.error(error.message); return; }
    toast.success("Student removed");
    setDeleteId(null);
    qc.invalidateQueries({ queryKey: ["students"] });
    qc.invalidateQueries({ queryKey: ["student-stats"] });
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-bold text-primary">Students</h1>
        <p className="text-muted-foreground mt-1">Manage enrollment records and student profiles.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Users} label="Total Students" value={stats?.total ?? 0} />
        <StatCard icon={GraduationCap} label="Active Courses" value={stats?.uniqueCourses ?? 0} />
        <StatCard icon={UserCheck} label="On This Page" value={data?.rows.length ?? 0} />
      </div>

      <div className="bg-card border rounded-lg shadow-sm">
        <div className="p-4 flex flex-col md:flex-row gap-3 md:items-center justify-between border-b">
          <div className="flex flex-col sm:flex-row gap-2 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search name, email, admission no..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
            </div>
            <Select value={courseFilter} onValueChange={(v) => { setCourseFilter(v); setPage(0); }}>
              <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="All Courses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {COURSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" /> Add Student
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Admission No.</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : data?.rows.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No students found. Click "Add Student" to get started.</TableCell></TableRow>
              ) : (
                data?.rows.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={s.photo_url ?? undefined} />
                          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">{s.name.split(" ").map((n: string) => n[0]).join("").slice(0,2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{s.name}</div>
                          <div className="text-xs text-muted-foreground capitalize">{s.gender}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="font-mono">{s.admission_no}</Badge></TableCell>
                    <TableCell className="max-w-[200px] truncate">{s.course}</TableCell>
                    <TableCell>Year {s.year}</TableCell>
                    <TableCell>
                      <div className="text-sm">{s.email}</div>
                      <div className="text-xs text-muted-foreground">{s.mobile}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(s); setDialogOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(s.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="p-4 flex items-center justify-between border-t">
          <div className="text-sm text-muted-foreground">
            {data?.count ?? 0} total · Page {page + 1} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {dialogOpen && (
        <StudentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          initial={editing}
          onSaved={() => { refetch(); qc.invalidateQueries({ queryKey: ["student-stats"] }); }}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Drop this student?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The record will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">Drop Student</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="bg-card border rounded-lg p-5 flex items-center gap-4 shadow-sm">
      <div className="h-12 w-12 rounded-md bg-accent/20 flex items-center justify-center">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="font-display text-3xl font-bold text-primary">{value}</div>
      </div>
    </div>
  );
}
