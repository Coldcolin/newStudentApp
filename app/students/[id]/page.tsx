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
import { deleteStudentRating } from "@/lib/api/assignments";

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

const getTotalColor = (total: number) =>
  total >= 18
    ? "text-[#34a853]"
    : total >= 15
      ? "text-[#ffb703]"
      : "text-[#ec1c24]";

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [ratingWeekToDelete, setRatingWeekToDelete] = useState<number | null>(
    null,
  );
  const [isDeletingRating, setIsDeletingRating] = useState(false);
  const [student, setStudent] = useState<any>(
    studentsData[id] || studentsData["1"],
  );
  const [loading, setLoading] = useState(true);
  const currentUser = useCurrentUser();
  const isAdmin = currentUser?.role === "admin";
  const isAlumni = student?.role === "alumni";

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await axiosInstance.delete(`/users/remove/${id}/`);
      setShowDeleteDialog(false);
      toast.success("Student deleted successfully");
      router.push("/students");
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Failed to delete student");
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
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

  const handleDeleteRating = async () => {
    if (ratingWeekToDelete == null) return;
    try {
      setIsDeletingRating(true);
      await deleteStudentRating(id, ratingWeekToDelete);
      setRatingWeekToDelete(null);
      toast.success("Rating deleted successfully");
      await handleGetStudentInfo();
    } catch (error) {
      console.error("Error deleting rating:", error);
      toast.error("Failed to delete rating");
    } finally {
      setIsDeletingRating(false);
    }
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

  const ratings = student.allRatings ?? [];
  const hasRatings = ratings.length > 0;

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
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
              <Avatar className="h-24 w-24 border-4 border-[#ffb703]">
                <AvatarImage src={student.image} />
                <AvatarFallback className="bg-[#ffb703] text-[#08022b] text-2xl">
                  {student.name?.charAt(0) || "S"}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1 text-center md:text-left">
                <div className="flex flex-col items-center gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold break-words text-foreground md:text-2xl">
                      {student.name}
                    </h2>
                    <p className="text-muted-foreground">
                      {student.stack} Developer
                    </p>
                    <div className="mt-2">{getStatusBadge("active")}</div>
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
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

                <div className="mt-4 flex flex-wrap justify-center gap-4 md:justify-start md:gap-6">
                  <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="break-all">{student.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>
                      Enrolled{" "}
                      {student.createdAt
                        ? new Date(student.createdAt).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GraduationCap className="h-4 w-4 shrink-0" />
                    <span>Cohort {student.cohort}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <Card className="border-none shadow-sm">
            <CardContent className="p-3 md:p-6">
              <div className="text-center">
                <p className="text-xl font-bold text-[#ffb703] md:text-3xl">
                  {student.overallRating?.toFixed(1) || "N/A"}
                </p>
                <p className="text-xs text-muted-foreground md:text-sm">
                  Overall Rating
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-3 md:p-6">
              <div className="text-center">
                <p className="text-xl font-bold text-foreground md:text-3xl">
                  {student.allRatings?.length || 0}
                </p>
                <p className="text-xs text-muted-foreground md:text-sm">
                  Weeks Assessed
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-3 md:p-6">
              <div className="text-center">
                <p className="text-xl font-bold text-[#34a853] md:text-3xl">
                  {student.weeklyRating?.toFixed(1) ||
                    (student.allRatings?.length > 0
                      ? student.allRatings[
                          student.allRatings.length - 1
                        ]?.total?.toFixed(1)
                      : "N/A")}
                </p>
                <p className="text-xs text-muted-foreground md:text-sm">
                  Weekly Rating
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grading History */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between px-4 md:px-6">
            <CardTitle>Grading History</CardTitle>
            {/* <Button 
              className="bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]"
              onClick={handleGradeSubmit}
            >
              Submit Grade
            </Button> */}
          </CardHeader>
          <CardContent className="p-0">
            {!hasRatings ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                No ratings available
              </p>
            ) : (
              <>
                <div className="space-y-3 px-4 pb-4 md:hidden">
                  {ratings.map((item: any) => (
                    <div
                      key={item._id ?? item.week}
                      className="mx-auto w-full max-w-[310px] rounded-lg border border-border bg-muted/40 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            Week {item.week}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.createdAt
                              ? new Date(item.createdAt).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <p
                            className={`text-sm font-bold ${getTotalColor(item.total)}`}
                          >
                            {item.total}
                          </p>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[#ec1c24] hover:bg-[#ec1c24]/10 hover:text-[#ec1c24]"
                              onClick={() => setRatingWeekToDelete(item.week)}
                              disabled={
                                isDeletingRating &&
                                ratingWeekToDelete === item.week
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-md bg-background/70 px-3 py-2">
                          <p className="text-xs text-muted-foreground">
                            Punctuality
                          </p>
                          <p className="text-sm font-medium">
                            {item.punctuality}
                          </p>
                        </div>
                        <div className="rounded-md bg-background/70 px-3 py-2">
                          <p className="text-xs text-muted-foreground">
                            Assignments
                          </p>
                          <p className="text-sm font-medium">
                            {item.Assignments}
                          </p>
                        </div>
                        <div className="rounded-md bg-background/70 px-3 py-2">
                          <p className="text-xs text-muted-foreground">
                            Defense
                          </p>
                          <p className="text-sm font-medium">
                            {item.personalDefense}
                          </p>
                        </div>
                        <div className="rounded-md bg-background/70 px-3 py-2">
                          <p className="text-xs text-muted-foreground">
                            Participation
                          </p>
                          <p className="text-sm font-medium">
                            {item.classParticipation}
                          </p>
                        </div>
                        <div className="rounded-md bg-background/70 px-3 py-2">
                          <p className="text-xs text-muted-foreground">
                            Assessment
                          </p>
                          <p className="text-sm font-medium">
                            {item.classAssessment}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden overflow-x-auto px-2 md:block">
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
                        {isAdmin && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ratings.map((item: any) => (
                        <TableRow key={item._id ?? item.week}>
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
                              className={`font-semibold ${getTotalColor(item.total)}`}
                            >
                              {item.total}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.createdAt
                              ? new Date(item.createdAt).toLocaleDateString()
                              : "N/A"}
                          </TableCell>
                          {isAdmin && (
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-[#ec1c24] hover:bg-[#ec1c24]/10 hover:text-[#ec1c24]"
                                onClick={() =>
                                  setRatingWeekToDelete(item.week)
                                }
                                disabled={
                                  isDeletingRating &&
                                  ratingWeekToDelete === item.week
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
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
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rating Delete Confirmation Dialog */}
      {isAdmin && (
        <Dialog
          open={ratingWeekToDelete != null}
          onOpenChange={(open) => {
            if (!open) setRatingWeekToDelete(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Delete Week {ratingWeekToDelete} rating?
              </DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the
                rating for this week.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setRatingWeekToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#ec1c24] text-white hover:bg-[#ec1c24]/90"
                onClick={handleDeleteRating}
                disabled={isDeletingRating}
              >
                {isDeletingRating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
