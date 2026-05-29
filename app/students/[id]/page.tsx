"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Calendar,
  GraduationCap,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useCurrentUser } from "@/lib/store/hooks";
import axiosInstance from "@/lib/api/axios";

// Mock student data
const studentsData: Record<
  string,
  {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    cohort: string;
    enrollmentDate: string;
    status: string;
    grade: string;
    phone: string;
    address: string;
    bio: string;
  }
> = {
  "1": {
    id: "1",
    firstName: "Amanda",
    lastName: "Chukwuma",
    email: "amanda.c@email.com",
    cohort: "Cohort 2024",
    enrollmentDate: "2024-01-15",
    status: "active",
    grade: "A",
    phone: "+1 234 567 8900",
    address: "123 Education Street, Learning City",
    bio: "Passionate learner focused on web development and design.",
  },
  "2": {
    id: "2",
    firstName: "David",
    lastName: "Okonkwo",
    email: "david.o@email.com",
    cohort: "Cohort 2024",
    enrollmentDate: "2024-01-20",
    status: "active",
    grade: "B+",
    phone: "+1 234 567 8901",
    address: "456 Knowledge Ave, Study Town",
    bio: "Aspiring software engineer with interest in AI.",
  },
};

// Mock grading history
const gradingHistory = [
  {
    week: "Week 1",
    assignment: "HTML Basics",
    score: 95,
    maxScore: 100,
    date: "2024-01-22",
  },
  {
    week: "Week 2",
    assignment: "CSS Fundamentals",
    score: 88,
    maxScore: 100,
    date: "2024-01-29",
  },
  {
    week: "Week 3",
    assignment: "JavaScript Intro",
    score: 92,
    maxScore: 100,
    date: "2024-02-05",
  },
  {
    week: "Week 4",
    assignment: "DOM Manipulation",
    score: 85,
    maxScore: 100,
    date: "2024-02-12",
  },
  {
    week: "Week 5",
    assignment: "React Basics",
    score: 90,
    maxScore: 100,
    date: "2024-02-19",
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return (
        <Badge className="bg-[#34a853]/10 text-[#34a853] hover:bg-[#34a853]/20">
          Active
        </Badge>
      );
    case "inactive":
      return (
        <Badge className="bg-[#687182]/10 text-[#687182] hover:bg-[#687182]/20">
          Inactive
        </Badge>
      );
    case "suspended":
      return (
        <Badge className="bg-[#ec1c24]/10 text-[#ec1c24] hover:bg-[#ec1c24]/20">
          Suspended
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAlumniDialog, setShowAlumniDialog] = useState(false);
  const [isUpdatingAlumni, setIsUpdatingAlumni] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [student, setStudent] = useState<any>(
    studentsData[id] || studentsData["1"],
  );
  const [loading, setLoading] = useState(true);
  const currentUser = useCurrentUser();
  const isAdmin = currentUser?.role === "admin";
  const isAlumni = student?.role === "alumni";

  const handleDelete = () => {
    setShowDeleteDialog(false);
    toast.success("Student deleted successfully");
    router.push("/students");
  };

  const handleMakeAlumni = async () => {
    try {
      setIsUpdatingAlumni(true);
      const endpoint = isAlumni ? `/users/student/${id}` : `/users/alumni/${id}`;
      const message = isAlumni
        ? "Student marked as active successfully"
        : "Student marked as alumni successfully";
      await axiosInstance.patch(endpoint);
      toast.success(message);
      setShowAlumniDialog(false);
      router.push("/students");
    } catch (error) {
      console.error("Error updating student status:", error);
      toast.error("Failed to update student status");
      setShowAlumniDialog(false);
    } finally {
      setIsUpdatingAlumni(false);
    }
  };

  const handleGradeSubmit = () => {
    setShowSuccessDialog(true);
  };

  const handleGetStudentInfo = async () => {
    try {
      setLoading(true);
      console.log("Fetching student with id:", id);
      const response = await axiosInstance.get(`/users/students/${id}`);
      console.log("Full response:", response);
      console.log("Response data:", response.data);
      // Handle both direct data and nested data structures
      const studentData = response.data?.data || response.data;
      setStudent(studentData);
    } catch (error) {
      console.error("Error fetching student:", error);
      toast.error("Failed to fetch student info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGetStudentInfo();
  }, [id]);

  return (
    <DashboardLayout title="Profile">
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Profile Header */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
              <Avatar className="h-24 w-24 border-4 border-[#ffb703]">
                <AvatarImage src={student.image} />
                <AvatarFallback className="bg-[#ffb703] text-[#08022b] text-2xl">
                  {student.name?.charAt(0) || "S"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col items-center gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {student.name}
                    </h2>
                    <p className="text-muted-foreground">
                      {student.stack} Developer
                    </p>
                    <div className="mt-2">{getStatusBadge("active")}</div>
                  </div>
                  <div className="flex gap-2">
                    {/* <Button variant="outline" className="gap-2">
                      <Edit className="h-4 w-4" />
                      Edit Profile
                    </Button> */}
                    {isAdmin && (
                      <>
                        <Button
                          variant="outline"
                          className={`gap-2 ${
                            isAlumni
                              ? "text-[#ffb703] hover:bg-[#ffb703]/10 hover:text-[#ffb703]"
                              : "text-[#34a853] hover:bg-[#34a853]/10 hover:text-[#34a853]"
                          }`}
                          onClick={() => setShowAlumniDialog(true)}
                        >
                          <GraduationCap className="h-4 w-4" />
                          {isAlumni ? "Make Student" : "Make Alumni"}
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2 text-[#ec1c24] hover:bg-[#ec1c24]/10 hover:text-[#ec1c24]"
                          onClick={() => setShowDeleteDialog(true)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap justify-center gap-6 md:justify-start">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{student.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Enrolled{" "}
                      {student.createdAt
                        ? new Date(student.createdAt).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GraduationCap className="h-4 w-4" />
                    <span>Cohort {student.cohort}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-[#ffb703]">
                  {student.overallRating?.toFixed(1) || "N/A"}
                </p>
                <p className="text-sm text-muted-foreground">Overall Rating</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">
                  {student.allRatings?.length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Weeks Assessed</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-[#34a853]">
                  {student.weeklyRating?.toFixed(1) ||
                    (student.allRatings?.length > 0
                      ? student.allRatings[
                          student.allRatings.length - 1
                        ]?.total?.toFixed(1)
                      : "N/A")}
                </p>
                <p className="text-sm text-muted-foreground">Weekly Rating</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grading History */}
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Grading History</CardTitle>
            {/* <Button 
              className="bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]"
              onClick={handleGradeSubmit}
            >
              Submit Grade
            </Button> */}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week</TableHead>
                  <TableHead>Punctuality</TableHead>
                  <TableHead>Assignments</TableHead>
                  <TableHead>Defense</TableHead>
                  <TableHead>Participation</TableHead>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.allRatings?.map((item: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      Week {item.week}
                    </TableCell>
                    <TableCell>{item.punctuality}</TableCell>
                    <TableCell>{item.Assignments}</TableCell>
                    <TableCell>{item.personalDefense}</TableCell>
                    <TableCell>{item.classParticipation}</TableCell>
                    <TableCell>{item.classAssessment}</TableCell>
                    <TableCell>
                      <span
                        className={`font-semibold ${
                          item.total >= 18
                            ? "text-[#34a853]"
                            : item.total >= 15
                              ? "text-[#ffb703]"
                              : "text-[#ec1c24]"
                        }`}
                      >
                        {item.total}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                )) || (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground"
                    >
                      No ratings available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Are you sure you want to delete this record?
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              student record and remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#ec1c24] text-white hover:bg-[#ec1c24]/90"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alumni/Student Confirmation Dialog */}
      <Dialog open={showAlumniDialog} onOpenChange={setShowAlumniDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isAlumni
                ? "Move this student back to active?"
                : "Mark this student as alumni?"}
            </DialogTitle>
            <DialogDescription>
              {isAlumni
                ? "This action will move the student back to active student status."
                : "This action will move the student to alumni status. They will no longer appear in the active student list."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowAlumniDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className={`${
                isAlumni
                  ? "bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]"
                  : "bg-[#34a853] text-white hover:bg-[#34a853]/90"
              }`}
              onClick={handleMakeAlumni}
              disabled={isUpdatingAlumni}
            >
              {isUpdatingAlumni ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="text-center sm:max-w-md">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#34a853]/10">
              <CheckCircle className="h-8 w-8 text-[#34a853]" />
            </div>
            <DialogTitle>Student grading has been processed</DialogTitle>
            <DialogDescription>
              The grade has been successfully submitted and recorded.
            </DialogDescription>
            <Button
              className="mt-2 bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]"
              onClick={() => setShowSuccessDialog(false)}
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
