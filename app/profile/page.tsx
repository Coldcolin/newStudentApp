"use client";

import { useState } from "react";
import { Camera, Edit2, Check, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser, useAppDispatch } from "@/lib/store/hooks";
import { updateUser } from "@/lib/store/slices/authSlice";
import { toast } from "sonner";

// Mock grading history
const gradingHistory = [
  { id: "1", assessment: "Week 1 Assessment", date: "2024-01-20", score: 85, maxScore: 100 },
  { id: "2", assessment: "JavaScript Quiz", date: "2024-01-25", score: 92, maxScore: 100 },
  { id: "3", assessment: "Week 2 Assessment", date: "2024-01-27", score: 78, maxScore: 100 },
  { id: "4", assessment: "React Fundamentals", date: "2024-02-01", score: 88, maxScore: 100 },
  { id: "5", assessment: "Week 3 Assessment", date: "2024-02-03", score: 95, maxScore: 100 },
];

export default function ProfilePage() {
  const user = useCurrentUser();
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    bio: "Passionate about learning and technology. Currently studying web development at Curve Academy.",
  });

  const handleSave = () => {
    dispatch(
      updateUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
      })
    );
    setIsEditing(false);
    setShowSuccess(true);
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      bio: "Passionate about learning and technology. Currently studying web development at Curve Academy.",
    });
    setIsEditing(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[#34a853]";
    if (score >= 60) return "text-[#ffb703]";
    return "text-[#ec1c24]";
  };

  return (
    <DashboardLayout title="My Profile">
      <div className="space-y-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="grades">Grading History</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            {/* Profile Card */}
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="h-32 w-32 border-4 border-[#ffb703]">
                      <AvatarImage
                        src={user?.avatar || "/placeholder.svg?height=128&width=128&query=user%20profile"}
                      />
                      <AvatarFallback className="bg-[#ffb703] text-[#08022b] text-3xl">
                        {user?.firstName?.[0]}
                        {user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <button className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500] transition-colors">
                      <Camera className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center md:text-left">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                              id="firstName"
                              value={formData.firstName}
                              onChange={(e) =>
                                setFormData({ ...formData, firstName: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              value={formData.lastName}
                              onChange={(e) =>
                                setFormData({ ...formData, lastName: e.target.value })
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({ ...formData, email: e.target.value })
                            }
                            disabled
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            value={formData.bio}
                            onChange={(e) =>
                              setFormData({ ...formData, bio: e.target.value })
                            }
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSave}
                            className="bg-[#34a853] text-white hover:bg-[#34a853]/90"
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Save Changes
                          </Button>
                          <Button variant="outline" onClick={handleCancel}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-center gap-2 md:justify-start">
                          <h2 className="text-2xl font-bold text-foreground">
                            {user?.firstName} {user?.lastName}
                          </h2>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsEditing(true)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-muted-foreground">{user?.email}</p>
                        <Badge className="mt-2 bg-[#ffb703]/10 text-[#ffb703] capitalize">
                          {user?.role}
                        </Badge>
                        <p className="mt-4 text-foreground">{formData.bio}</p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-none shadow-sm">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-[#ffb703]">87%</p>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-[#34a853]">15</p>
                  <p className="text-sm text-muted-foreground">
                    Completed Assessments
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-[#219ebc]">3</p>
                  <p className="text-sm text-muted-foreground">
                    Pending Assignments
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="grades">
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader>
                <CardTitle>Grading History</CardTitle>
              </CardHeader>
              <CardContent className="p-0 md:p-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Assessment</TableHead>
                        <TableHead className="whitespace-nowrap">Date</TableHead>
                        <TableHead className="whitespace-nowrap">Score</TableHead>
                        <TableHead className="whitespace-nowrap">Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gradingHistory.map((grade) => (
                        <TableRow key={grade.id}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {grade.assessment}
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {new Date(grade.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {grade.score}/{grade.maxScore}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`font-semibold ${getScoreColor(
                                (grade.score / grade.maxScore) * 100
                              )}`}
                            >
                              {Math.round((grade.score / grade.maxScore) * 100)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Change Password</Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input type="password" placeholder="Current password" />
                    <Input type="password" placeholder="New password" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notification Preferences</Label>
                  <p className="text-sm text-muted-foreground">
                    Manage your email and push notification settings
                  </p>
                </div>
                <Button className="bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]">
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Success Dialog */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogTitle className="sr-only">Profile Update Success</DialogTitle>
            <DialogDescription className="sr-only">Your profile has been updated successfully</DialogDescription>
            <div className="flex flex-col items-center py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#34a853]/10">
                <Check className="h-8 w-8 text-[#34a853]" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">Profile Updated!</h3>
              <p className="mt-2 text-center text-muted-foreground">
                Your profile has been updated successfully.
              </p>
              <Button
                onClick={() => setShowSuccess(false)}
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
