"use client";

import { useEffect, useState, useRef } from "react";
import { Camera, Edit2, Check, X, Eye, EyeOff } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import axiosInstance from "@/lib/api/axios";

interface DashboardData {
  student: {
    _id: string;
    name: string;
    image: string;
    email: string;
    stack: string;
    bio: string;
    phone: string;
  };
  stats: {
    avgScore: number;
    completed: number;
    pending: number;
  };
}

export default function ProfilePage() {
  const user = useCurrentUser();
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {},
  );
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashboardResponse, userResponse] = await Promise.all([
          axiosInstance.get("/users/dashboard"),
          user?.id
            ? axiosInstance.get(`/users/oneUser/${user.id}`)
            : Promise.resolve(null),
        ]);

        console.log("Dashboard API Response:", dashboardResponse.data);
        setDashboardData(dashboardResponse.data);

        if (userResponse?.data) {
          const userData = userResponse.data?.data || userResponse.data;
          if (userData) {
            setFormData((prev) => ({
              ...prev,
              fullName: userData.name || prev.fullName,
              email: userData.email || prev.email,
              phone: userData.phone || prev.phone,
              bio: userData.bio || prev.bio,
            }));
            dispatch(
              updateUser({
                fullName: userData.name,
                avatar: userData.image,
                bio: userData.bio,
                phone: userData.phone,
              }),
            );
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      }
    };

    fetchDashboardData();
  }, [user?.id, dispatch]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (formData.phone.trim() && !/^\+?[\d\s-]{7,}$/.test(formData.phone))
      newErrors.phone = "Invalid phone number";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", formData.fullName.trim());
      fd.append("bio", formData.bio.trim());
      fd.append("phone", formData.phone.trim());
      if (imageFile) fd.append("image", imageFile);
      await axiosInstance.patch("/users/update", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      dispatch(
        updateUser({
          fullName: formData.fullName,
        }),
      );
      setIsEditing(false);
      setShowSuccess(true);
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const validatePassword = () => {
    const newErrors: Record<string, string> = {};
    if (!passwordData.currentPassword.trim())
      newErrors.currentPassword = "Current password is required";
    if (!passwordData.newPassword.trim())
      newErrors.newPassword = "New password is required";
    else if (passwordData.newPassword.length < 8)
      newErrors.newPassword = "Password must be at least 8 characters";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword))
      newErrors.newPassword = "Must include uppercase, lowercase, and a number";
    if (!passwordData.confirmPassword.trim())
      newErrors.confirmPassword = "Please confirm your new password";
    else if (passwordData.newPassword !== passwordData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveSettings = async () => {
    if (!validatePassword()) return;
    setIsSavingPassword(true);
    try {
      await axiosInstance.patch("/users/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success("Password changed successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors({});
    } catch (error) {
      console.error("Failed to change password:", error);
      toast.error("Failed to change password");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      bio: "Passionate about learning and technology. Currently studying web development at Curve Academy.",
    });
    setImageFile(null);
    setImagePreview(null);
    setErrors({});
    setIsEditing(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
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
            {/* <TabsTrigger value="grades">Grading History</TabsTrigger> */}
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
                        src={
                          imagePreview ||
                          dashboardData?.student?.image ||
                          user?.avatar ||
                          "/placeholder.svg?height=128&width=128&query=user%20profile"
                        }
                      />
                      <AvatarFallback className="bg-[#ffb703] text-[#08022b] text-3xl">
                        {dashboardData?.student?.name || user?.fullName}
                      </AvatarFallback>
                    </Avatar>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                    <button
                      type="button"
                      className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500] transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center md:text-left">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                              id="fullName"
                              value={formData.fullName}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  fullName: e.target.value,
                                })
                              }
                            />
                            {errors.fullName && (
                              <p className="text-sm text-[#ec1c24]">
                                {errors.fullName}
                              </p>
                            )}
                          </div>
                          {/* <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              value={formData.lastName}
                              onChange={(e) =>
                                setFormData({ ...formData, lastName: e.target.value })
                              }
                            />
                          </div> */}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                            disabled
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                phone: e.target.value,
                              })
                            }
                          />
                          {errors.phone && (
                            <p className="text-sm text-[#ec1c24]">
                              {errors.phone}
                            </p>
                          )}
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
                            disabled={isSaving}
                            className="bg-[#34a853] text-white hover:bg-[#34a853]/90"
                          >
                            <Check className="mr-2 h-4 w-4" />
                            {isSaving ? "Saving..." : "Save Changes"}
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
                            {dashboardData?.student?.name || user?.fullName}
                          </h2>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsEditing(true)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-muted-foreground">
                          {dashboardData?.student?.email || user?.email}
                        </p>
                        <Badge className="mt-2 bg-[#ffb703]/10 text-[#ffb703] capitalize">
                          {dashboardData?.student?.stack || user?.role}
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
                  <p className="text-3xl font-bold text-[#ffb703]">
                    {dashboardData?.stats?.avgScore ?? 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-[#34a853]">
                    {dashboardData?.stats?.completed ?? 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Completed Assessments
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-[#219ebc]">
                    {dashboardData?.stats?.pending ?? 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Pending Assignments
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* <TabsContent value="grades">
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader>
                <CardTitle>Grading History</CardTitle>
              </CardHeader>
              <CardContent className="p-0 md:p-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">
                          Assessment
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          Date
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          Score
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          Percentage
                        </TableHead>
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
                                (grade.score / grade.maxScore) * 100,
                              )}`}
                            >
                              {Math.round((grade.score / grade.maxScore) * 100)}
                              %
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent> */}

          <TabsContent value="settings">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Change Password</Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          type={showPasswords.current ? "text" : "password"}
                          placeholder="Current password"
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              currentPassword: e.target.value,
                            })
                          }
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              current: !showPasswords.current,
                            })
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showPasswords.current ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.currentPassword && (
                        <p className="text-sm text-[#ec1c24]">
                          {passwordErrors.currentPassword}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          type={showPasswords.new ? "text" : "password"}
                          placeholder="New password"
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              newPassword: e.target.value,
                            })
                          }
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              new: !showPasswords.new,
                            })
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showPasswords.new ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.newPassword && (
                        <p className="text-sm text-[#ec1c24]">
                          {passwordErrors.newPassword}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          type={showPasswords.confirm ? "text" : "password"}
                          placeholder="Confirm new password"
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirmPassword: e.target.value,
                            })
                          }
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              confirm: !showPasswords.confirm,
                            })
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.confirmPassword && (
                        <p className="text-sm text-[#ec1c24]">
                          {passwordErrors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleSaveSettings}
                  disabled={isSavingPassword}
                  className="bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]"
                >
                  {isSavingPassword ? "Saving..." : "Save Settings"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Success Dialog */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogTitle className="sr-only">
              Profile Update Success
            </DialogTitle>
            <DialogDescription className="sr-only">
              Your profile has been updated successfully
            </DialogDescription>
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
