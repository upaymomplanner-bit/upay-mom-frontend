"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2 } from "lucide-react";
import { DepartmentProgress } from "@/api/analytics";

interface DepartmentProgressTableProps {
  data: DepartmentProgress[];
  isLoading: boolean;
}

function formatHours(hours: number | null): string {
  if (hours === null || hours === undefined || hours === 0) return "N/A";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours.toFixed(0)}h`;
}

export function DepartmentProgressTable({
  data,
  isLoading,
}: DepartmentProgressTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Department Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="animate-pulse h-12 bg-muted rounded"
              ></div>
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
            <Building2 className="h-5 w-5" />
            Department Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No department data available
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group by city for better visualization
  const groupedByCity = data.reduce((acc, item) => {
    if (!acc[item.city_name]) {
      acc[item.city_name] = [];
    }
    acc[item.city_name].push(item);
    return acc;
  }, {} as Record<string, DepartmentProgress[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Department Progress by City
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(groupedByCity).map(([cityName, departments]) => (
            <div
              key={cityName}
              className="space-y-2"
            >
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {cityName}
              </h4>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-center">Tasks</TableHead>
                      <TableHead className="text-center">Progress</TableHead>
                      <TableHead className="text-center">Overdue</TableHead>
                      <TableHead className="text-right">
                        Avg Close Time
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map((dept) => (
                      <TableRow key={`${dept.city_id}-${dept.department_id}`}>
                        <TableCell className="font-medium">
                          {dept.department_name}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-primary font-medium">
                            {dept.completed_tasks}
                          </span>
                          <span className="text-muted-foreground">
                            {" "}
                            / {dept.total_tasks}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={dept.completion_rate}
                              className="h-2 flex-1"
                            />
                            <span className="text-xs text-muted-foreground w-10">
                              {dept.completion_rate}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {dept.overdue_tasks > 0 ? (
                            <span className="text-destructive font-medium">
                              {dept.overdue_tasks}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatHours(dept.avg_completion_time_hours)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
