"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MapPin, Clock } from "lucide-react";
import { ClosureTimeByCity } from "@/api/analytics";

interface ClosureTimeByCityCardProps {
  data: ClosureTimeByCity[];
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

export function ClosureTimeByCityCard({
  data,
  isLoading,
}: ClosureTimeByCityCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <Clock className="h-5 w-5" />
            Closure Time by City
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse h-10 bg-muted rounded"
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
            <MapPin className="h-5 w-5" />
            <Clock className="h-5 w-5" />
            Closure Time by City
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          <Clock className="h-5 w-5" />
          Closure Time by City
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>City</TableHead>
                <TableHead className="text-center">Completed</TableHead>
                <TableHead className="text-center">Avg Time</TableHead>
                <TableHead className="text-center">Median</TableHead>
                <TableHead className="text-center text-destructive">
                  Urgent
                </TableHead>
                <TableHead className="text-center">Important</TableHead>
                <TableHead className="text-center">Medium</TableHead>
                <TableHead className="text-center">Low</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((city) => (
                <TableRow key={city.city_id}>
                  <TableCell className="font-medium">
                    {city.city_name}
                  </TableCell>
                  <TableCell className="text-center">
                    {city.total_completed}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {formatHours(city.avg_closure_hours)}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {formatHours(city.median_closure_hours)}
                  </TableCell>
                  <TableCell className="text-center">
                    {formatHours(city.urgent_avg_hours)}
                  </TableCell>
                  <TableCell className="text-center">
                    {formatHours(city.important_avg_hours)}
                  </TableCell>
                  <TableCell className="text-center">
                    {formatHours(city.medium_avg_hours)}
                  </TableCell>
                  <TableCell className="text-center">
                    {formatHours(city.low_avg_hours)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
