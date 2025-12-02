import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckSquare, Target, Clock } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Fetch stats with error handling
  const { count: upcomingMeetings } = await supabase
    .from("meetings")
    .select("*", { count: "exact", head: true })
    .gte("scheduled_at", new Date().toISOString());

  const { count: totalTasks } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true });

  const { count: pendingTasks } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .in("status", ["todo", "in_progress"]);

  const { count: activeGoals } = await supabase
    .from("goals")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground">
          Welcome to your Minutes of Meeting dashboard
        </p>
      </div>

      {/* Upload CTA */}
      <Card className="border-2 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500 rounded-lg">
                <svg
                  className="h-8 w-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-900 dark:text-green-100">
                  Upload Meeting Transcript
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Let AI automatically extract tasks and goals from your meeting
                  minutes
                </p>
              </div>
            </div>
            <a
              href="/dashboard/upload"
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl"
            >
              Upload Now
            </a>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Meetings
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingMeetings || 0}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled in the future
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tasks in progress or todo
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks || 0}</div>
            <p className="text-xs text-muted-foreground">All tasks created</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeGoals || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently being tracked
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <a
              href="/dashboard/meetings"
              className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-accent transition-colors"
            >
              <Calendar className="h-8 w-8 mb-2 text-violet-500" />
              <span className="font-medium">View Meetings</span>
            </a>
            <a
              href="/dashboard/tasks"
              className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-accent transition-colors"
            >
              <CheckSquare className="h-8 w-8 mb-2 text-pink-700" />
              <span className="font-medium">Manage Tasks</span>
            </a>
            <a
              href="/dashboard/goals"
              className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-accent transition-colors"
            >
              <Target className="h-8 w-8 mb-2 text-orange-700" />
              <span className="font-medium">Track Goals</span>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
