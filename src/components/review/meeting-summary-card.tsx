"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { MeetingDetails } from "@/types/meeting";
import { Calendar, FileText } from "lucide-react";

interface MeetingSummaryCardProps {
  meetingDetails: MeetingDetails;
  meetingSummary: string;
  onUpdateTitle: (title: string) => void;
  onUpdateDate: (date: string) => void;
  onUpdateSummary: (summary: string) => void;
}

export function MeetingSummaryCard({
  meetingDetails,
  meetingSummary,
  onUpdateTitle,
  onUpdateDate,
  onUpdateSummary,
}: MeetingSummaryCardProps) {
  return (
    <Card className="border-2">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500 rounded-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <CardTitle>Meeting Details</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <Label htmlFor="meeting-title">Meeting Title</Label>
          <Input
            id="meeting-title"
            value={meetingDetails.meeting_title || ""}
            onChange={(e) => onUpdateTitle(e.target.value)}
            placeholder="Enter meeting title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="meeting-date">Meeting Date</Label>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              id="meeting-date"
              type="datetime-local"
              value={
                meetingDetails.meeting_date
                  ? new Date(meetingDetails.meeting_date)
                      .toISOString()
                      .slice(0, 16)
                  : ""
              }
              onChange={(e) =>
                onUpdateDate(new Date(e.target.value).toISOString())
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meeting-summary">Meeting Summary</Label>
          <Textarea
            id="meeting-summary"
            value={meetingSummary}
            onChange={(e) => onUpdateSummary(e.target.value)}
            placeholder="Enter meeting summary"
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="pt-2 text-sm text-muted-foreground">
          Review and edit the meeting details before confirming
        </div>
      </CardContent>
    </Card>
  );
}
