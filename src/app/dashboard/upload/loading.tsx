import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function UploadLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-80 mt-2" />
      </div>

      <div className="max-w-3xl">
        {/* Info Alert Skeleton */}
        <div className="flex items-start gap-3 p-4 border rounded-lg mb-6">
          <Skeleton className="h-5 w-5" />
          <div className="flex-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full mt-2" />
            <Skeleton className="h-4 w-3/4 mt-1" />
          </div>
        </div>

        {/* Upload Card Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-1" />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Input Label Skeleton */}
            <Skeleton className="h-4 w-20" />
            
            {/* Drop Zone Skeleton */}
            <div className="border-2 border-dashed rounded-lg p-12">
              <div className="flex flex-col items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="text-center">
                  <Skeleton className="h-5 w-48 mx-auto" />
                  <Skeleton className="h-4 w-32 mx-auto mt-2" />
                </div>
              </div>
            </div>

            {/* Button Skeleton */}
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>

        {/* Tips Card Skeleton */}
        <Card className="mt-6">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Skeleton className="h-4 w-4 mt-0.5" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
