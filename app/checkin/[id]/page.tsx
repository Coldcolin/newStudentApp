"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Check, FileCheck, Loader2 } from "lucide-react";
import axiosInstance from "@/lib/api/axios";

interface AttendanceImage {
  url: string;
  public_id: string;
}

interface AttendanceRecord {
  _id: string;
  date: string;
  time: string;
  location: string;
  punctualityScore: number;
  image?: AttendanceImage;
  userId: string[];
  createdAt: string;
  updatedAt: string;
}

interface StudentAttendanceApiResponse {
  message: string;
  averagePunctualityScore: number;
  data: AttendanceRecord[];
}

interface StudentRecord {
  _id: string;
  name: string;
  email: string;
  overallRating: number;
  weeklyRating: number;
  stack: string;
}

interface StudentsApiResponse {
  data: StudentRecord[];
}

interface StudentData {
  id: string;
  name: string;
  email: string;
  avgRating: string;
  currentRating: string;
  stack: string;
  attendance: AttendanceRecord[];
  avgPunctuality: string;
}

// Student Attendance Card Component
function StudentAttendanceCard({ record }: { record: AttendanceRecord }) {
  const [isImageOpen, setIsImageOpen] = useState(false);
  const hasImage = Boolean(record.image?.url);

  const formattedDate = new Date(record.date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = new Date(
    `2000-01-01T${record.time}`,
  ).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsImageOpen(true);
    }
  };

  return (
    <>
      <Card
        className={`border border-border shadow-sm transition-shadow ${
          hasImage ? "cursor-pointer hover:shadow-md" : ""
        }`}
        onClick={hasImage ? () => setIsImageOpen(true) : undefined}
        onKeyDown={hasImage ? handleKeyDown : undefined}
        role={hasImage ? "button" : undefined}
        tabIndex={hasImage ? 0 : undefined}
      >
        <CardContent className="p-4 flex flex-col items-center text-center">
          {record.image?.url && (
            <div className="mb-3 w-full">
              <img
                src={record.image.url}
                alt="Check-in"
                className="w-full h-32 object-cover rounded-lg"
              />
            </div>
          )}
          <p className="text-sm text-muted-foreground">{formattedDate}</p>
          <p className="text-sm text-muted-foreground">
            Check-in Time:{" "}
            <span className="font-medium text-foreground">{formattedTime}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Score:{" "}
            <span className="font-medium text-foreground">
              {record.punctualityScore}%
            </span>
          </p>
        </CardContent>
      </Card>

      {hasImage && (
        <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
          <DialogContent className="sm:max-w-3xl p-4">
            <DialogTitle>Check-in Photo</DialogTitle>
            <DialogDescription>
              {formattedDate} · {formattedTime} · Score:{" "}
              {record.punctualityScore}%
            </DialogDescription>
            <img
              src={record.image!.url}
              alt="Check-in photo"
              className="w-full max-h-[70vh] object-contain rounded-lg"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default function StudentCheckInDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  const fetchStudent = useCallback(async () => {
    setIsLoading(true);
    try {
      const { id } = await params;

      // Fetch student info from students list
      const studentsResponse =
        await axiosInstance.get<StudentsApiResponse>("/users/students");
      const studentRecord = studentsResponse.data.data.find(
        (s) => s._id === id,
      );

      if (!studentRecord) {
        console.error("Student not found in students list");
        setIsLoading(false);
        return;
      }

      // Fetch attendance data
      const attendanceResponse =
        await axiosInstance.get<StudentAttendanceApiResponse>(
          `/api/v1/studentAttendance/${id}`,
        );

      const avgPunctuality =
        attendanceResponse.data.averagePunctualityScore || 0;
      const attendanceRecords = attendanceResponse.data.data || [];

      setStudent({
        id: studentRecord._id,
        name: studentRecord.name,
        email: studentRecord.email,
        stack: studentRecord.stack,
        avgRating: `${studentRecord.overallRating?.toFixed(2) || 0}%`,
        currentRating: `${Math.round(studentRecord.weeklyRating) || 0}%`,
        avgPunctuality: `${avgPunctuality}%`,
        attendance: attendanceRecords,
      });
    } catch (error) {
      console.error("Failed to fetch student attendance:", error);
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  const handleAcknowledge = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmAcknowledge = async () => {
    if (!student) return;

    setIsAcknowledging(true);
    try {
      await axiosInstance.delete(`/api/v1/deleteCheckInfullWeek/${student.id}`);
      setShowConfirmDialog(false);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Failed to acknowledge punctuality record:", error);
    } finally {
      setIsAcknowledging(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessDialog(false);
    router.push("/checkin");
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Attendance">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#ffb703]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout title="Attendance">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">
              Student Not Found
            </h1>
          </div>
          <p className="text-muted-foreground">
            The student you are looking for could not be found.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Attendance">
      <div className="space-y-6">
        {/* Back button and title */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            Confirm Punctuality
          </h1>
        </div>

        {/* Student Info */}
        <div className="flex items-center gap-4 p-4 bg-card rounded-lg">
          <Avatar className="h-14 w-14">
            <AvatarImage
              src={`/placeholder.svg?height=56&width=56&query=student%20${student.id}`}
            />
            <AvatarFallback className="bg-[#ffb703] text-lg">
              {student.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">{student.name}</p>
            <p className="text-sm text-muted-foreground">
              Average Rating: {student.avgRating}
            </p>
          </div>
        </div>

        {/* Attendance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {student.attendance.map((record, index) => (
            <StudentAttendanceCard key={index} record={record} />
          ))}
        </div>

        {/* Average Score and Acknowledge Button */}
        <div className="flex flex-col items-center gap-4 py-6">
          <p className="text-lg font-medium text-foreground">
            Average Punctuality Score:{" "}
            <span className="font-bold">{student.avgPunctuality}</span>
          </p>
          <Button
            onClick={handleAcknowledge}
            className="bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500] px-6"
          >
            <FileCheck className="mr-2 h-5 w-5" />
            Acknowledge
          </Button>
        </div>

        {/* Confirmation Dialog */}
        <AlertDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Acknowledgement</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to acknowledge the punctuality record for{" "}
                {student.name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmAcknowledge}
                disabled={isAcknowledging}
                className="bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]"
              >
                {isAcknowledging ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogTitle className="sr-only">
              Acknowledgement Success
            </DialogTitle>
            <DialogDescription className="sr-only">
              Punctuality record acknowledged
            </DialogDescription>
            <div className="flex flex-col items-center py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#34a853]/10">
                <Check className="h-8 w-8 text-[#34a853]" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">Acknowledged!</h3>
              <p className="mt-2 text-center text-muted-foreground">
                Punctuality record for {student.name} has been acknowledged.
              </p>
              <Button
                onClick={handleCloseSuccess}
                className="mt-6 bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]"
              >
                Continue
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
