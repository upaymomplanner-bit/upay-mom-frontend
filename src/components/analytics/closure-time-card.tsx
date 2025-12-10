"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap, AlertCircle, Minus, ArrowDown } from "lucide-react";
import { ClosureTimeByPriority, WeightedAvgClosureTime } from "@/api/analytics";

interface ClosureTimeCardProps {
  priorityData: ClosureTimeByPriority[];
  weightedData: WeightedAvgClosureTime | null;
  isLoading: boolean;
}

function formatHours(hours: number | null): string {
  if (hours === null || hours === undefined) return "N/A";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours.toFixed(0)}h`;
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "urgent":
      return "bg-red-100 text-red-800 border-red-300";
    case "important":
      return "bg-orange-100 text-orange-800 border-orange-300";
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "low":
      return "bg-green-100 text-green-800 border-green-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
}

function getPriorityIcon(priority: string) {
  switch (priority) {
    case "urgent":
      return <Zap className="h-3 w-3" />;
    case "important":
      return <AlertCircle className="h-3 w-3" />;
    case "medium":
      return <Minus className="h-3 w-3" />;
    case "low":
      return <ArrowDown className="h-3 w-3" />;
    default:
      return null;
  }
}

export function ClosureTimeCard({
  priorityData,
  weightedData,
  isLoading,
}: ClosureTimeCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Task Closure Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse flex justify-between"
              >
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Task Closure Time
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Weighted Average Summary */}
        {weightedData && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">
              Weighted Average (by priority)
            </div>
            <div className="text-2xl font-bold">
              {formatHours(weightedData.weighted_avg_hours)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Based on {weightedData.total_tasks} completed tasks
            </div>
          </div>
        )}

        {/* By Priority Breakdown */}
        <div className="space-y-3">
          <div className="text-sm font-medium">Average by Priority</div>
          {!priorityData || priorityData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data available</p>
          ) : (
            priorityData.map((item) => (
              <div
                key={item.priority}
                className="flex items-center justify-between p-2 rounded-lg border"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={getPriorityColor(item.priority)}
                  >
                    {getPriorityIcon(item.priority)}
                    <span className="ml-1 capitalize">{item.priority}</span>
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    ({item.total_completed} tasks)
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {formatHours(item.avg_closure_hours)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    median: {formatHours(item.median_closure_hours)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
