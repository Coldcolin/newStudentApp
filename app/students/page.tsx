"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Search, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { useCurrentUser } from "@/lib/store/hooks";

// Types for different views
type ViewType = "students" | "alumni" | "staffs";

interface StudentRecord {
  id: string;
  name: string;
  email: string;
  avgRating: string;
  currentRating: string;
  stack: string;
}

interface StaffRecord {
  id: string;
  name: string;
  email: string;
  role: string;
}

const tabs = ["Front-End", "Back-End", "Product Design"];

export default function StudentsPage() {
  const user = useCurrentUser();
  const [activeTab, setActiveTab] = useState("Front-End");
  const [currentView, setCurrentView] = useState<ViewType>("students");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [studentData, setStudentData] = useState<StudentRecord[]>([]);
  const [staffData, setStaffData] = useState<StaffRecord[]>([]);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        type: currentView,
        stack: currentView !== "staffs" ? activeTab : "all",
      });
      
      const response = await fetch(`/api/students/search?${params}`);
      const result = await response.json();
      
      if (currentView === "staffs") {
        setStaffData(result.data);
      } else {
        setStudentData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, currentView, activeTab]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [fetchData]);

  // Reset search when changing view
  useEffect(() => {
    setSearchQuery("");
  }, [currentView]);

  const getViewTitle = () => {
    switch (currentView) {
      case "students":
        return "All students";
      case "alumni":
        return "Alumni";
      case "staffs":
        return "Staffs";
      default:
        return "All students";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Greeting Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Hi {user?.firstName || "Helen"}
          </h1>
          <p className="text-muted-foreground">
            {"It's week 5 at The Curve Africa"}
          </p>
        </div>

        {/* Page Title with Back Arrow */}
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h2 className="text-lg font-semibold text-foreground">{getViewTitle()}</h2>
        </div>

        {/* View Selector - Small tabs/links to switch between views */}
        <div className="flex gap-4 text-sm">
          <button
            onClick={() => setCurrentView("students")}
            className={`font-medium ${currentView === "students" ? "text-[#ffb703]" : "text-muted-foreground hover:text-foreground"}`}
          >
            Students
          </button>
          <button
            onClick={() => setCurrentView("alumni")}
            className={`font-medium ${currentView === "alumni" ? "text-[#ffb703]" : "text-muted-foreground hover:text-foreground"}`}
          >
            Alumni
          </button>
          <button
            onClick={() => setCurrentView("staffs")}
            className={`font-medium ${currentView === "staffs" ? "text-[#ffb703]" : "text-muted-foreground hover:text-foreground"}`}
          >
            Staffs
          </button>
        </div>

        {/* Search Input */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={`Search ${currentView}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-200"
          />
        </div>

        {/* Stack Filter Tabs - Only show for students/alumni */}
        {currentView !== "staffs" && (
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-[#ffb703] text-[#08022b]"
                    : "bg-white text-foreground hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* Data Table */}
        <Card className="border-none bg-white shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#ffb703]" />
              </div>
            ) : (
            <div className="overflow-x-auto">
              {currentView === "staffs" ? (
                // Staff Table
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-100 hover:bg-transparent">
                      <TableHead className="text-xs text-muted-foreground font-medium whitespace-nowrap py-4 px-4">
                        Name
                      </TableHead>
                      <TableHead className="text-xs text-muted-foreground font-medium whitespace-nowrap py-4">
                        Email address
                      </TableHead>
                      <TableHead className="text-xs text-muted-foreground font-medium whitespace-nowrap py-4">
                        Role
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffData.map((staff, index) => (
                      <TableRow
                        key={index}
                        className="border-b border-gray-50 hover:bg-gray-50/50"
                      >
                        <TableCell className="py-4 px-4">
                          <span className="text-sm font-medium">{staff.name}</span>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="text-sm text-[#219ebc]">{staff.email}</span>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="text-sm text-muted-foreground">{staff.role}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                // Students/Alumni Table
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-100 hover:bg-transparent">
                      <TableHead className="w-[60px] text-xs text-muted-foreground font-medium whitespace-nowrap py-4 px-4">
                        Week
                      </TableHead>
                      <TableHead className="text-xs text-muted-foreground font-medium whitespace-nowrap py-4">
                        Name
                      </TableHead>
                      <TableHead className="text-xs text-muted-foreground font-medium whitespace-nowrap py-4">
                        Average Rating
                      </TableHead>
                      <TableHead className="text-xs text-muted-foreground font-medium whitespace-nowrap py-4 text-right pr-4">
                        Current Rating
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentData.map((student, index) => (
                      <TableRow
                        key={index}
                        className="border-b border-gray-50 hover:bg-gray-50/50"
                      >
                        <TableCell className="py-4 px-4 text-sm text-muted-foreground">
                          {student.id}
                        </TableCell>
                        <TableCell className="py-4">
                          <Link 
                            href={`/students/${student.id}`}
                            className="text-sm font-medium hover:text-[#ffb703] transition-colors"
                          >
                            {student.name}
                          </Link>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="text-sm font-medium text-[#ffb703]">
                            {student.avgRating}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 text-right pr-4">
                          {student.currentRating && (
                            <span className="text-sm font-medium text-[#34a853]">
                              {student.currentRating}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
