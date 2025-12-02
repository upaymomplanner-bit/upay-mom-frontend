import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default async function GoalsPage() {
  const supabase = await createClient();

  const { data: goals } = await supabase
    .from("goals")
    .select(
      `
      *,
      departments(name)
    `
    )
    .order("year", { ascending: false })
    .order("quarter", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Goals</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goals?.map((goal) => (
          <Card key={goal.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold">
                  {goal.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {goal.departments?.name || "Organization Wide"}
                </p>
              </div>
              <Badge
                variant={
                  goal.status === "on_track"
                    ? "default"
                    : goal.status === "at_risk"
                    ? "destructive"
                    : "secondary"
                }
              >
                {goal.status.replace("_", " ")}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                {goal.description}
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Progress</span>
                  <span>
                    {goal.status === "completed" ? "100%" : "In Progress"}
                  </span>
                </div>
                <Progress value={goal.status === "completed" ? 100 : 45} />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                <span>
                  {goal.year} Q{goal.quarter}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!goals || goals.length === 0) && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No goals defined yet.
          </div>
        )}
      </div>
    </div>
  );
}
