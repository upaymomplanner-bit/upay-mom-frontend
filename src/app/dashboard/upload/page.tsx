"use client";

import { useState } from "react";
import { uploadTranscript } from "@/app/actions/upload";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle2,
  UploadCloud,
  FileText,
  X,
} from "lucide-react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleFileChange = (selectedFile: File) => {
    if (
      selectedFile &&
      (selectedFile.type === "application/pdf" ||
        selectedFile.type === "text/plain")
    ) {
      setFile(selectedFile);
      setStatus(null);
    } else {
      setStatus({ type: "error", message: "Please upload a PDF or TXT file" });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadTranscript(formData);

    if (result.error) {
      setStatus({ type: "error", message: result.error });
      setUploading(false);
    } else {
      // Store parsed data in session storage for review
      sessionStorage.setItem(
        "pending-meeting-data",
        JSON.stringify(result.data)
      );

      // Navigate to review page
      window.location.href = "/dashboard/upload/review";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Upload Transcript</h2>
        <p className="text-muted-foreground">
          Upload meeting minutes to automatically extract tasks and goals
        </p>
      </div>

      <div className="max-w-3xl">
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <UploadCloud className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Upload Meeting Minutes</CardTitle>
                <CardDescription>
                  PDF or TXT files supported • Automatically extract action
                  items
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Drag and Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                isDragging
                  ? "border-green-500 bg-green-50 dark:bg-green-950"
                  : "border-gray-300 hover:border-green-400 hover:bg-gray-50 dark:hover:bg-gray-900"
              }`}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <UploadCloud className="h-12 w-12 text-gray-400" />
                </div>
                <div>
                  <p className="text-lg font-medium">
                    {isDragging
                      ? "Drop your file here"
                      : "Drag and drop your transcript"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse
                  </p>
                </div>
                <Label
                  htmlFor="transcript"
                  className="cursor-pointer px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Choose File
                </Label>
                <input
                  id="transcript"
                  type="file"
                  accept=".pdf,.txt"
                  onChange={(e) =>
                    e.target.files && handleFileChange(e.target.files[0])
                  }
                  className="hidden"
                />
              </div>
            </div>

            {/* Selected File Display */}
            {file && (
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <FileText className="h-10 w-10 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-green-900 dark:text-green-100">
                    {file.name}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFile(null)}
                  className="text-green-600 hover:text-green-700 hover:bg-green-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Status Messages */}
            {status && (
              <div
                className={`flex items-start gap-3 p-4 rounded-lg ${
                  status.type === "success"
                    ? "bg-green-50 border border-green-200 dark:bg-green-950 dark:border-green-800"
                    : "bg-red-50 border border-red-200 dark:bg-red-950 dark:border-red-800"
                }`}
              >
                {status.type === "success" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p
                    className={`font-medium ${
                      status.type === "success"
                        ? "text-green-900 dark:text-green-100"
                        : "text-red-900 dark:text-red-100"
                    }`}
                  >
                    {status.type === "success" ? "Success!" : "Error"}
                  </p>
                  <p
                    className={`text-sm ${
                      status.type === "success"
                        ? "text-green-700 dark:text-green-300"
                        : "text-red-700 dark:text-red-300"
                    }`}
                  >
                    {status.message}
                  </p>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full py-6 text-lg"
              size="lg"
            >
              {uploading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Processing Transcript...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-5 w-5" />
                  Upload & Process Transcript
                </>
              )}
            </Button>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                How it works:
              </h4>
              <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li className="flex items-start gap-2">
                  <span className="font-bold">1.</span>
                  <span>Upload your meeting minutes as a PDF or TXT file</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">2.</span>
                  <span>
                    Our AI will analyze the transcript and extract action items
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">3.</span>
                  <span>
                    Tasks and goals will be automatically created and assigned
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">4.</span>
                  <span>
                    Review and manage extracted items in the Tasks and Goals
                    sections
                  </span>
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
