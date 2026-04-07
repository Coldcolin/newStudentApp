"use client";

import { useState } from "react";
import { Users, GraduationCap, Leaf } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCurrentUser } from "@/lib/store/hooks";
import Link from "next/link";

// Students of the week data
const studentsOfWeek = [
  {
    id: "1",
    name: "Victoria Daniels",
    role: "Front-End Trainee",
    avatar:
      "/placeholder.svg?height=200&width=200&query=african%20woman%20professional",
    bgColor: "bg-[#dbeafe]",
    cardShadow: "shadow-[0_10px_30px_rgba(0,0,0,0.17)]",
  },
  {
    id: "2",
    name: "Vivian Miles",
    role: "Back-End Trainee",
    avatar:
      "/placeholder.svg?height=200&width=200&query=african%20man%20science%20shirt",
    bgColor: "bg-[#f5e6d3]",
    cardShadow: "shadow-[0_10px_30px_rgba(0,0,0,0.17)]",
  },
  {
    id: "3",
    name: "Frank Nige",
    role: "Product Design Trainee",
    avatar:
      "/placeholder.svg?height=200&width=200&query=african%20man%20casual",
    bgColor: "bg-[#fef9c3]",
    cardShadow: "shadow-[0_10px_30px_rgba(0,0,0,0.17)]",
  },
];

// Stats data
const stats = [
  {
    label: "Students",
    value: 51,
    icon: GraduationCap,
    iconColor: "text-[#ffb703]",
    iconBg: "bg-[#ffb703]/10",
  },
  {
    label: "Staffs",
    value: 7,
    icon: Users,
    iconColor: "text-[#219ebc]",
    iconBg: "bg-[#219ebc]/10",
  },
  {
    label: "Alumnis",
    value: 57,
    icon: Leaf,
    iconColor: "text-[#34a853]",
    iconBg: "bg-[#34a853]/10",
  },
];

// History data - mobile version shows different columns
const historyData = [
  {
    id: 19,
    name: "Francesca Agbaozo",
    avgRating: "82.5%",
    currentRating: "96%",
  },
  {
    id: 19,
    name: "Francesca Agbaozo",
    avgRating: "82.5%",
    currentRating: "96%",
  },
  {
    id: 19,
    name: "Francesca Agbaozo",
    avgRating: "82.5%",
    currentRating: "96%",
  },
  {
    id: 19,
    name: "Francesca Agbaozo",
    avgRating: "82.5%",
    currentRating: "90%",
  },
  {
    id: 19,
    name: "Francesca Agbaozo",
    avgRating: "82.5%",
    currentRating: "96%",
  },
  {
    id: 19,
    name: "Francesca Agbaozo",
    avgRating: "82.5%",
    currentRating: "96%",
  },
  {
    id: 19,
    name: "Francesca Agbaozo",
    avgRating: "82.5%",
    currentRating: "96%",
  },
  {
    id: 19,
    name: "Francesca Agbaozo",
    avgRating: "82.5%",
    currentRating: "96%",
  },
  {
    id: 19,
    name: "Francesca Agbaozo",
    avgRating: "82.5%",
    currentRating: "96%",
  },
  {
    id: 19,
    name: "Francesca Agbaozo",
    avgRating: "82.5%",
    currentRating: "96%",
  },
];

const tabs = ["Front-End", "Back-End", "Product Design"];

export default function DashboardPage() {
  const user = useCurrentUser();
  const [activeTab, setActiveTab] = useState("Front-End");

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-[#1a365d]">
            Hi {user?.firstName || "Helen"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {"It's week 5 at The Curve Africa"}
          </p>
        </div>

        {/* Students Of The Week */}
        <div className="">
          <h2 className="mb-4 text-center text-xl font-semibold text-foreground md:text-left">
            Students Of The Week
          </h2>

          {/* Mobile: Single column, Desktop: Row with stats on right */}
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Student Cards */}
            <div className="flex flex-col gap-6 md:flex-row md:flex-wrap md:gap-10 lg:flex-1">
              {studentsOfWeek.map((student, index) => (
                <Link
                  key={`${student.id}-${index}`}
                  href={`/students/${student.id}`}
                  className="group flex-1"
                >
                  <Card
                    className={`border-none ${student.bgColor} ${student.cardShadow} transition-shadow hover:shadow-lg rounded-2xl`}
                  >
                    <CardContent className="flex flex-col items-center p-5">
                      <div className="rounded-full p-0 bg-white/50">
                        <Avatar className="h-24 w-24 ring-0 md:h-28 md:w-28">
                          <AvatarImage
                            src={student.avatar}
                            alt={student.name}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-[#ffb703] text-xl text-[#08022b]">
                            {student.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <h3 className="mt-3 text-center font-semibold text-foreground text-sm md:text-base">
                        {student.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {student.role}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Stats Cards - Stack on mobile, vertical on desktop */}
            <div className="flex flex-col gap-4 lg:w-[180px]">
              {stats.map((stat) => (
                <Card
                  key={stat.label}
                  className="border-none bg-white shadow-sm"
                >
                  <CardContent className="flex items-center justify-center gap-4 p-4 md:justify-start">
                    <div className={`rounded-lg p-2 ${stat.iconBg}`}>
                      <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                    </div>
                    <div className="text-center md:text-left">
                      <p className="text-2xl font-bold text-foreground">
                        {stat.value}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* History Section */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            History
          </h2>

          {/* Tabs - Pill shaped buttons */}
          <div className="mb-6 flex flex-wrap gap-3">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all border ${
                  activeTab === tab
                    ? "bg-[#ffb703] text-[#08022b] border-[#ffb703]"
                    : "bg-white text-foreground border-gray-200 hover:border-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Table - Responsive for mobile */}
          <Card className="border-none bg-white shadow-sm overflow-hidden">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-100 hover:bg-transparent">
                    <TableHead className="w-[50px] text-xs text-muted-foreground">
                      Week
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground">
                      Name
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground">
                      Average Rating
                    </TableHead>
                    <TableHead className="text-right text-xs text-muted-foreground">
                      Current Rating
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyData.map((row, index) => (
                    <TableRow
                      key={index}
                      className="border-b border-gray-50 hover:bg-gray-50/50"
                    >
                      <TableCell className="py-3 text-sm text-muted-foreground">
                        {row.id}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="text-sm font-medium">{row.name}</div>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-sm font-medium text-[#ffb703]">
                          {row.avgRating}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <span className="text-sm font-medium text-[#34a853]">
                          {row.currentRating}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
