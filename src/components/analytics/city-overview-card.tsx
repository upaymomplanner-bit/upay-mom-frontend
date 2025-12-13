"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MapPin, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { CityTasksOverview } from "@/api/analytics";

interface CityOverviewCardProps {
  data: CityTasksOverview[];
  isLoading: boolean;
}

export function CityOverviewCard({ data, isLoading }: CityOverviewCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Tasks by City
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse"
              >
                <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                <div className="h-2 bg-muted rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Tasks by City
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No city data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Tasks by City
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data.map((city) => (
            <div
              key={city.city_id}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{city.city_name}</span>
                <span className="text-sm text-muted-foreground">
                  {city.total_tasks} tasks
                </span>
              </div>

              <Progress
                value={city.completion_rate}
                className="h-2"
              />

              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="default">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {city.completed_tasks} done
                </Badge>
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  {city.in_progress_tasks} in progress
                </Badge>
                <Badge variant="outline">
                  {city.todo_tasks} todo
                </Badge>
                {city.overdue_tasks > 0 && (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {city.overdue_tasks} overdue
                  </Badge>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                {city.completion_rate}% completion rate
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
