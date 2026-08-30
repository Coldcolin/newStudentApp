"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/store/hooks";
import { useAppearance } from "@/components/providers/appearance-provider";
import { useProgramSettings } from "@/components/providers/program-settings-provider";
import { updateProgramSettings } from "@/lib/api/settings";
import { cn } from "@/lib/utils";

const MAX_TOTAL_WEEKS = 52;

export default function SettingsPage() {
  const user = useCurrentUser();
  // Tutors are mapped to the "admin" role at login, so this covers both.
  const isAdmin = user?.role === "admin";

  const handleSave = () => {
    toast.success("Settings saved successfully!");
  };

  return (
    <DashboardLayout title="Settings">
      <div className="mx-auto max-w-4xl space-y-6">
        <Tabs defaultValue="general" className="space-y-6">
          <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
            <TabsList className="h-auto w-max min-w-full justify-start">
              <TabsTrigger value="general">General</TabsTrigger>
              {/* <TabsTrigger value="notifications">Notifications</TabsTrigger> */}
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              {isAdmin && <TabsTrigger value="program">Program</TabsTrigger>}
            </TabsList>
          </div>

          {isAdmin && (
            <TabsContent value="program">
              <ProgramSettingsTab />
            </TabsContent>
          )}

          <TabsContent value="general">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Manage your account preferences and settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select defaultValue="utc">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utc">UTC</SelectItem>
                        <SelectItem value="est">Eastern Time</SelectItem>
                        <SelectItem value="pst">Pacific Time</SelectItem>
                        <SelectItem value="gmt">GMT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select defaultValue="mdy">
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleSave}
                  className="w-full bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500] sm:w-auto"
                >
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to receive notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch defaultChecked className="shrink-0" />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications in browser
                      </p>
                    </div>
                    <Switch defaultChecked className="shrink-0" />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium">Assessment Reminders</p>
                      <p className="text-sm text-muted-foreground">
                        Get reminded about upcoming assessments
                      </p>
                    </div>
                    <Switch defaultChecked className="shrink-0" />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium">Grade Updates</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified when grades are posted
                      </p>
                    </div>
                    <Switch defaultChecked className="shrink-0" />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium">Marketing Emails</p>
                      <p className="text-sm text-muted-foreground">
                        Receive news and promotional content
                      </p>
                    </div>
                    <Switch className="shrink-0" />
                  </div>
                </div>
                <Button
                  onClick={handleSave}
                  className="w-full bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500] sm:w-auto"
                >
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your password and security preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Button variant="outline" className="w-full shrink-0 sm:w-auto">
                    Enable
                  </Button>
                </div>
                <Button
                  onClick={handleSave}
                  className="w-full bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500] sm:w-auto"
                >
                  Update Password
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <AppearanceSettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function AppearanceSettingsTab() {
  const {
    theme,
    compact,
    reduceMotion,
    setTheme,
    setCompact,
    setReduceMotion,
  } = useAppearance();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = mounted ? theme : undefined;

  const handleSaveAppearance = () => {
    toast.success("Settings saved successfully!");
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize the look and feel of the application.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg p-2 sm:p-4",
                  activeTheme === "light"
                    ? "border-2 border-[#ffb703]"
                    : "border border-border hover:border-[#ffb703]/50",
                )}
              >
                <div className="h-8 w-full rounded bg-white sm:h-10" />
                <span className="text-sm font-medium">Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg p-2 sm:p-4",
                  activeTheme === "dark"
                    ? "border-2 border-[#ffb703]"
                    : "border border-border hover:border-[#ffb703]/50",
                )}
              >
                <div className="h-8 w-full rounded bg-[#08022b] sm:h-10" />
                <span className="text-sm font-medium">Dark</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("system")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg p-2 sm:p-4",
                  activeTheme === "system"
                    ? "border-2 border-[#ffb703]"
                    : "border border-border hover:border-[#ffb703]/50",
                )}
              >
                <div className="h-8 w-full rounded bg-gradient-to-r from-white to-[#08022b] sm:h-10" />
                <span className="text-sm font-medium">System</span>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium">Compact Mode</p>
              <p className="text-sm text-muted-foreground">
                Use smaller UI elements for more content
              </p>
            </div>
            <Switch
              checked={compact}
              onCheckedChange={setCompact}
              className="shrink-0"
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium">Reduce Motion</p>
              <p className="text-sm text-muted-foreground">
                Minimize animations throughout the app
              </p>
            </div>
            <Switch
              checked={reduceMotion}
              onCheckedChange={setReduceMotion}
              className="shrink-0"
            />
          </div>
        </div>
        <Button
          onClick={handleSaveAppearance}
          className="w-full bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500] sm:w-auto"
        >
          Save Appearance
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * The one settings tab wired to a real API. Controls the week the whole app
 * defaults to — the dashboard greeting, the task board, and grading.
 */
function ProgramSettingsTab() {
  const {
    startDate,
    weekOverride,
    totalWeeks,
    currentWeek,
    isLoading,
    isLoaded,
    applySettings,
  } = useProgramSettings();

  const [form, setForm] = useState({
    startDate: "",
    totalWeeks: "24",
    isPinned: false,
    weekOverride: "1",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Seed the form from the shared settings once they have settled.
  useEffect(() => {
    if (!isLoaded) return;
    setForm({
      startDate: startDate ?? "",
      totalWeeks: String(totalWeeks),
      isPinned: weekOverride !== null,
      weekOverride: String(weekOverride ?? currentWeek),
    });
  }, [startDate, weekOverride, totalWeeks, currentWeek, isLoaded]);

  const parsedTotalWeeks = parseInt(form.totalWeeks, 10);
  const parsedOverride = parseInt(form.weekOverride, 10);

  const handleSaveProgram = async () => {
    if (
      isNaN(parsedTotalWeeks) ||
      parsedTotalWeeks < 1 ||
      parsedTotalWeeks > MAX_TOTAL_WEEKS
    ) {
      toast.error(`Program length must be between 1 and ${MAX_TOTAL_WEEKS} weeks`);
      return;
    }

    if (
      form.isPinned &&
      (isNaN(parsedOverride) ||
        parsedOverride < 1 ||
        parsedOverride > parsedTotalWeeks)
    ) {
      toast.error(`Pinned week must be between 1 and ${parsedTotalWeeks}`);
      return;
    }

    setIsSaving(true);
    try {
      const { settings } = await updateProgramSettings({
        startDate: form.startDate || null,
        totalWeeks: parsedTotalWeeks,
        weekOverride: form.isPinned ? parsedOverride : null,
      });
      // Push straight into the shared context so every page picks up the new
      // week without a reload.
      applySettings(settings);
      toast.success("Program settings saved successfully!");
    } catch (error) {
      console.error("Failed to save program settings:", error);
      const message =
        error instanceof Error ? error.message : "Please try again.";
      toast.error(`Failed to save program settings. ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <CardTitle>Program Settings</CardTitle>
        <CardDescription>
          Controls the week used across the app — the dashboard greeting, the
          task board, and grading defaults.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <p className="text-sm text-muted-foreground">Current week</p>
          <p className="text-2xl font-semibold text-foreground">
            Week {currentWeek}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {weekOverride !== null
                ? "(pinned)"
                : startDate
                  ? "(from start date)"
                  : "(no start date set)"}
            </span>
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cohortStartDate">Cohort Start Date</Label>
            <Input
              id="cohortStartDate"
              type="date"
              value={form.startDate}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, startDate: e.target.value }))
              }
            />
            <p className="text-xs text-muted-foreground">
              The week advances automatically from this date. Weeks start on
              Monday.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalWeeks">Program Length (weeks)</Label>
            <Input
              id="totalWeeks"
              type="number"
              min="1"
              max={MAX_TOTAL_WEEKS}
              value={form.totalWeeks}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, totalWeeks: e.target.value }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Sets the range of every week picker in the app.
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-border p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-medium">Pin the current week</p>
              <p className="text-sm text-muted-foreground">
                Hold the week in place during a break, instead of letting it
                advance from the start date.
              </p>
            </div>
            <Switch
              checked={form.isPinned}
              onCheckedChange={(checked) =>
                setForm((prev) => ({ ...prev, isPinned: checked }))
              }
              className="shrink-0"
            />
          </div>
          {form.isPinned && (
            <div className="space-y-2">
              <Label htmlFor="weekOverride">Pinned week</Label>
              <Input
                id="weekOverride"
                type="number"
                min="1"
                max={form.totalWeeks}
                value={form.weekOverride}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, weekOverride: e.target.value }))
                }
                className="w-full md:w-[200px]"
              />
            </div>
          )}
        </div>

        <Button
          onClick={handleSaveProgram}
          disabled={isSaving || isLoading}
          className="w-full bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500] sm:w-auto"
        >
          {isSaving ? "Saving..." : "Save Program Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
