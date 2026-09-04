"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
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
import { StudentAttendanceCard } from "@/components/attendance/student-attendance-card";
import {
  getStudentAttendance,
  type AttendanceRecord,
} from "@/lib/api/attendance";

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
      const attendanceResponse = await getStudentAttendance(id);

      const avgPunctuality = attendanceResponse.averagePunctualityScore || 0;
      const attendanceRecords = attendanceResponse.data || [];

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
