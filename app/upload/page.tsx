"use client";

import { useState, useCallback } from "react";
import { Upload, X, File, Image, Check } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: "uploading" | "completed" | "error";
}

export default function UploadPage() {
  const [isDragActive, setIsDragActive] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  }, []);

  const processFiles = (fileList: FileList) => {
    const newFiles: UploadedFile[] = Array.from(fileList).map((file) => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      status: "uploading" as const,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // Simulate upload progress
    newFiles.forEach((file) => {
      const interval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) => {
            if (f.id === file.id) {
              const newProgress = Math.min(f.progress + 10, 100);
              return {
                ...f,
                progress: newProgress,
                status: newProgress === 100 ? "completed" : "uploading",
              };
            }
            return f;
          })
        );
      }, 200);

      setTimeout(() => {
        clearInterval(interval);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, progress: 100, status: "completed" } : f
          )
        );
      }, 2000);
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return <Image className="h-5 w-5 text-[#219ebc]" />;
    }
    return <File className="h-5 w-5 text-[#ffb703]" />;
  };

  const handleUpload = () => {
    const completedFiles = files.filter((f) => f.status === "completed");
    if (completedFiles.length === 0) {
      toast.error("Please add files to upload");
      return;
    }
    setShowSuccess(true);
    toast.success("Files uploaded successfully!");
  };

  return (
    <DashboardLayout title="Upload Image">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Upload Area */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Upload Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`relative rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
                isDragActive
                  ? "border-[#ffb703] bg-[#ffb703]/5"
                  : "border-border hover:border-[#ffb703]/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileInput}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ffb703]/10">
                  <Upload className="h-8 w-8 text-[#ffb703]" />
                </div>
                <div>
                  <p className="text-lg font-medium text-foreground">
                    Drag and drop files here
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    or click to browse from your computer
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Supports: JPG, PNG, GIF, PDF, DOC (Max 10MB)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Uploaded Files */}
        {files.length > 0 && (
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Uploaded Files ({files.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-4 rounded-lg border border-border p-4"
                  >
                    {getFileIcon(file.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground">{file.name}</p>
                        <button
                          onClick={() => removeFile(file.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                      {file.status === "uploading" && (
                        <Progress value={file.progress} className="mt-2 h-1" />
                      )}
                      {file.status === "completed" && (
                        <div className="mt-2 flex items-center gap-1 text-sm text-[#34a853]">
                          <Check className="h-4 w-4" />
                          Upload complete
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Button
                onClick={handleUpload}
                className="mt-6 w-full bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]"
              >
                Upload All Files
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Success Dialog */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogTitle className="sr-only">Upload Success</DialogTitle>
            <DialogDescription className="sr-only">Your files have been uploaded successfully</DialogDescription>
            <div className="flex flex-col items-center py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#34a853]/10">
                <Check className="h-8 w-8 text-[#34a853]" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">Upload Successful!</h3>
              <p className="mt-2 text-center text-muted-foreground">
                Your files have been uploaded successfully.
              </p>
              <Button
                onClick={() => {
                  setShowSuccess(false);
                  setFiles([]);
                }}
                className="mt-6 bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]"
              >
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
