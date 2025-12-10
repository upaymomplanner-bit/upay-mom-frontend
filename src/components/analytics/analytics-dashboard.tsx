"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, RefreshCw } from "lucide-react";
import {
  useTasksByCity,
  useDepartmentProgress,
  useClosureTimeByPriority,
  useWeightedAvgClosureTime,
  useClosureTimeByCity,
} from "@/hooks/useAnalytics";
import { DateRangeFilters } from "@/api/analytics";
import { CityOverviewCard } from "./city-overview-card";
import { ClosureTimeCard } from "./closure-time-card";
import { DepartmentProgressTable } from "./department-progress-table";
import { ClosureTimeByCityCard } from "./closure-time-by-city-card";

export function AnalyticsDashboard() {
  const [filters, setFilters] = useState<DateRangeFilters>({});
  const [tempFrom, setTempFrom] = useState("");
  const [tempTo, setTempTo] = useState("");

  // Queries
  const tasksByCity = useTasksByCity(filters);
  const departmentProgress = useDepartmentProgress(undefined, filters);
  const closureTimeByPriority = useClosureTimeByPriority(filters);
  const weightedAvgClosureTime = useWeightedAvgClosureTime(filters);
  const closureTimeByCity = useClosureTimeByCity(filters);

  const applyFilters = () => {
    setFilters({
      from: tempFrom || undefined,
      to: tempTo || undefined,
    });
  };

  const clearFilters = () => {
    setTempFrom("");
    setTempTo("");
    setFilters({});
  };

  const refetchAll = () => {
    tasksByCity.refetch();
    departmentProgress.refetch();
    closureTimeByPriority.refetch();
    weightedAvgClosureTime.refetch();
    closureTimeByCity.refetch();
  };

  const isAnyLoading =
    tasksByCity.isLoading ||
    departmentProgress.isLoading ||
    closureTimeByPriority.isLoading ||
    weightedAvgClosureTime.isLoading ||
    closureTimeByCity.isLoading;

  return (
    <div className="space-y-6">
      {/* Date Filter Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Date Range Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="from-date"
                className="text-sm"
              >
                From
              </Label>
              <Input
                id="from-date"
                type="date"
                value={tempFrom}
                onChange={(e) => setTempFrom(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="to-date"
                className="text-sm"
              >
                To
              </Label>
              <Input
                id="to-date"
                type="date"
                value={tempTo}
                onChange={(e) => setTempTo(e.target.value)}
                className="w-40"
              />
            </div>
            <Button
              onClick={applyFilters}
              size="sm"
            >
              Apply Filter
            </Button>
            <Button
              onClick={clearFilters}
              variant="outline"
              size="sm"
            >
              Clear
            </Button>
            <Button
              onClick={refetchAll}
              variant="ghost"
              size="sm"
              disabled={isAnyLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${isAnyLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
          {(filters.from || filters.to) && (
            <p className="text-xs text-muted-foreground mt-2">
              Showing data {filters.from && `from ${filters.from}`}
              {filters.from && filters.to && " "}
              {filters.to && `to ${filters.to}`}
            </p>
          )}
        </CardContent>
      </Card>

      {/* City Overview & Closure Time Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <CityOverviewCard
          data={tasksByCity.data || []}
          isLoading={tasksByCity.isLoading}
        />
        <ClosureTimeCard
          priorityData={closureTimeByPriority.data || []}
          weightedData={weightedAvgClosureTime.data || null}
          isLoading={
            closureTimeByPriority.isLoading || weightedAvgClosureTime.isLoading
          }
        />
      </div>

      {/* Department Progress Table */}
      <DepartmentProgressTable
        data={departmentProgress.data || []}
        isLoading={departmentProgress.isLoading}
      />

      {/* Closure Time by City */}
      <ClosureTimeByCityCard
        data={closureTimeByCity.data || []}
        isLoading={closureTimeByCity.isLoading}
      />
    </div>
  );
}
