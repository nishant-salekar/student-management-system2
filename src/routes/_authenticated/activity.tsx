import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Activity, Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/activity")({
  head: () => ({ meta: [{ title: "Activity Log — Pillai University SMS" }] }),
  component: ActivityPage,
});

const iconFor = (action: string) =>
  action === "CREATE" ? Plus : action === "UPDATE" ? Pencil : Trash2;

function ActivityPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["activity"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-bold text-primary flex items-center gap-3">
          <Activity className="h-8 w-8" /> Activity Log
        </h1>
        <p className="text-muted-foreground mt-1">Latest 100 changes to student records.</p>
      </header>

      <div className="bg-card border rounded-lg shadow-sm divide-y">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading...</div>
        ) : data?.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No activity yet.</div>
        ) : (
          data?.map((row: any) => {
            const Icon = iconFor(row.action);
            const color = row.action === "CREATE" ? "bg-emerald-100 text-emerald-700" : row.action === "UPDATE" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700";
            return (
              <div key={row.id} className="p-4 flex items-center gap-4">
                <div className={`h-10 w-10 rounded-md flex items-center justify-center ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{row.action}</span>
                    <Badge variant="outline" className="font-mono text-xs">{row.admission_no ?? "—"}</Badge>
                    {row.details?.name && <span className="text-sm">· {row.details.name}</span>}
                    {row.details?.course && <span className="text-xs text-muted-foreground">({row.details.course})</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
