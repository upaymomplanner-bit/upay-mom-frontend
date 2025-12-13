import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users } from "lucide-react";
import { format } from "date-fns";

export default async function MeetingsPage() {
  const supabase = await createClient();

  // Fetch all meetings
  const { data: meetings, error } = await supabase
    .from("meetings")
    .select(
      `
      id,
      title,
      scheduled_at,
      duration_minutes,
      status,
      meeting_type,
      department:departments(name)
    `
    )
    .order("scheduled_at", { ascending: false });

  const now = new Date();
  const upcomingMeetings =
    meetings?.filter((m) => new Date(m.scheduled_at) >= now) || [];
  const pastMeetings =
    meetings?.filter((m) => new Date(m.scheduled_at) < now) || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Meetings</h2>
          <p className="text-muted-foreground">
            View and manage all your meetings
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Meetings
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meetings?.length || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingMeetings.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled ahead</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pastMeetings.length}</div>
            <p className="text-xs text-muted-foreground">Past meetings</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Meetings */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Upcoming Meetings</h3>
        {upcomingMeetings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No upcoming meetings scheduled
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {upcomingMeetings.map((meeting) => (
              <Card key={meeting.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{meeting.title}</CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(meeting.scheduled_at), "PPP")}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(new Date(meeting.scheduled_at), "p")}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {meeting.department?.[0]?.name || "N/A"}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {meeting.status}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Past Meetings */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Past Meetings</h3>
        {pastMeetings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No past meetings found
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pastMeetings.slice(0, 10).map((meeting) => (
              <Card key={meeting.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{meeting.title}</CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(meeting.scheduled_at), "PPP")}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(new Date(meeting.scheduled_at), "p")}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {meeting.department?.[0]?.name || "N/A"}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {meeting.status}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
