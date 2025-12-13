import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CheckSquare, Target, Clock, Upload } from "lucide-react";
import Link from "next/link";

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
      <Card className="border-2 border-primary bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary rounded-lg">
                <Upload className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Upload Meeting Transcript</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Let AI automatically extract tasks and goals from your meeting
                  minutes
                </p>
              </div>
            </div>
            <Button
              asChild
              size="lg"
            >
              <Link href="/dashboard/upload">Upload Now</Link>
            </Button>
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
            <Link
              href="/dashboard/meetings"
              className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-accent transition-colors"
            >
              <Calendar className="h-8 w-8 mb-2 text-primary" />
              <span className="font-medium">View Meetings</span>
            </Link>
            <Link
              href="/dashboard/tasks"
              className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-accent transition-colors"
            >
              <CheckSquare className="h-8 w-8 mb-2 text-primary" />
              <span className="font-medium">Manage Tasks</span>
            </Link>
            <Link
              href="/dashboard/goals"
              className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-accent transition-colors"
            >
              <Target className="h-8 w-8 mb-2 text-primary" />
              <span className="font-medium">Track Goals</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
