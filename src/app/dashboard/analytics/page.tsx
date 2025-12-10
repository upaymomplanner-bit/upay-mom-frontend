import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  CheckSquare,
  Target,
  TrendingUp,
  Users,
  Building2,
  Clock,
  BarChart3,
} from "lucide-react";
import { AnalyticsDashboard } from "@/components/analytics";

export default async function AnalyticsPage() {
  const supabase = await createClient();

  // Fetch various statistics
  const { count: totalMeetings } = await supabase
    .from("meetings")
    .select("*", { count: "exact", head: true });

  const { count: totalTasks } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true });

  const { count: completedTasks } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed");

  const { count: totalGoals } = await supabase
    .from("goals")
    .select("*", { count: "exact", head: true });

  const { count: activeGoals } = await supabase
    .from("goals")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { count: totalDepartments } = await supabase
    .from("departments")
    .select("*", { count: "exact", head: true });

  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // Calculate percentages
  const taskCompletionRate =
    totalTasks && totalTasks > 0
      ? Math.round((completedTasks! / totalTasks) * 100)
      : 0;

  const goalActiveRate =
    totalGoals && totalGoals > 0
      ? Math.round((activeGoals! / totalGoals) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">
          Overview of your organization's performance
        </p>
      </div>

      {/* Overview Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Meetings
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMeetings || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks || 0}</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGoals || 0}</div>
            <p className="text-xs text-muted-foreground">
              {activeGoals || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDepartments || 0}</div>
            <p className="text-xs text-muted-foreground">Across organization</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Task Completion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskCompletionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks || 0} of {totalTasks || 0} tasks completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goal Progress</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goalActiveRate}%</div>
            <p className="text-xs text-muted-foreground">
              {activeGoals || 0} of {totalGoals || 0} goals active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Active users</p>
          </CardContent>
        </Card>
      </div>

      {/* Insights Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Meeting Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Total Meetings Conducted
              </span>
              <span className="font-bold">{totalMeetings || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Average per Department
              </span>
              <span className="font-bold">
                {totalDepartments && totalDepartments > 0
                  ? Math.round((totalMeetings || 0) / totalDepartments)
                  : 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Tasks per User
              </span>
              <span className="font-bold">
                {totalUsers && totalUsers > 0
                  ? Math.round((totalTasks || 0) / totalUsers)
                  : 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Completion Rate
              </span>
              <span className="font-bold">{taskCompletionRate}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* City & Department Analytics (Client-side with TanStack Query) */}
      <div className="pt-4 border-t">
        <h3 className="text-xl font-semibold mb-4">
          City & Department Analytics
        </h3>
        <AnalyticsDashboard />
      </div>
    </div>
  );
}
