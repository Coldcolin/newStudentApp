"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Camera, Check, X, MapPin, Loader2, ArrowLeft, FileCheck, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/lib/store/hooks";

type CheckInStatus = "idle" | "camera" | "processing" | "success" | "error";
type LocationStatus = "idle" | "requesting" | "granted" | "denied";

interface AttendanceRecord {
  id: string;
  date: string;
  status: "Early" | "Late";
  checkIn: string;
  checkOut: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface StudentAttendance {
  id: string;
  name: string;
  avatar?: string;
  day: string;
  serverTime: string;
  recommendedRating: string;
}

interface StudentData {
  id: string;
  name: string;
  email: string;
  avgRating: string;
  currentRating: string;
  attendance: StudentAttendance[];
  avgPunctuality: string;
}

// Mock attendance history data for students
const attendanceHistory: AttendanceRecord[] = [
  { id: "1", date: "October 18th 2024", status: "Early", checkIn: "9:00 am", checkOut: "5:00 pm" },
  { id: "2", date: "October 18th 2024", status: "Late", checkIn: "9:32 am", checkOut: "5:02 pm" },
  { id: "3", date: "October 18th 2024", status: "Early", checkIn: "9:00 am", checkOut: "5:00 pm" },
  { id: "4", date: "October 18th 2024", status: "Early", checkIn: "9:00 am", checkOut: "5:00 pm" },
  { id: "5", date: "October 18th 2024", status: "Late", checkIn: "9:45 am", checkOut: "5:15 pm" },
  { id: "6", date: "October 17th 2024", status: "Early", checkIn: "9:00 am", checkOut: "5:00 pm" },
  { id: "7", date: "October 17th 2024", status: "Early", checkIn: "9:00 am", checkOut: "5:00 pm" },
  { id: "8", date: "October 17th 2024", status: "Late", checkIn: "9:20 am", checkOut: "5:00 pm" },
];

// Mock student data for admin view
const studentsList: StudentData[] = [
  {
    id: "1",
    name: "Chisom Ikeadighim",
    email: "chisom@example.com",
    avgRating: "82.5%",
    currentRating: "96%",
    avgPunctuality: "20%",
    attendance: [
      { id: "1", name: "Chisom Ikeadighim", day: "Monday", serverTime: "9:50 pm", recommendedRating: "20%" },
      { id: "2", name: "Chisom Ikeadighim", day: "Wednesday", serverTime: "9:45 pm", recommendedRating: "20%" },
      { id: "3", name: "Chisom Ikeadighim", day: "Friday", serverTime: "9:00 pm", recommendedRating: "20%" },
    ],
  },
  {
    id: "2",
    name: "Francesca Agbaozo",
    email: "francesca@example.com",
    avgRating: "82.5%",
    currentRating: "96%",
    avgPunctuality: "85%",
    attendance: [
      { id: "1", name: "Francesca Agbaozo", day: "Monday", serverTime: "8:55 am", recommendedRating: "90%" },
      { id: "2", name: "Francesca Agbaozo", day: "Wednesday", serverTime: "8:50 am", recommendedRating: "85%" },
      { id: "3", name: "Francesca Agbaozo", day: "Friday", serverTime: "9:00 am", recommendedRating: "80%" },
    ],
  },
  {
    id: "3",
    name: "David Okonkwo",
    email: "david@example.com",
    avgRating: "78.5%",
    currentRating: "90%",
    avgPunctuality: "75%",
    attendance: [
      { id: "1", name: "David Okonkwo", day: "Monday", serverTime: "9:10 am", recommendedRating: "70%" },
      { id: "2", name: "David Okonkwo", day: "Wednesday", serverTime: "9:05 am", recommendedRating: "75%" },
      { id: "3", name: "David Okonkwo", day: "Friday", serverTime: "9:00 am", recommendedRating: "80%" },
    ],
  },
];

// Generate more students
for (let i = 4; i <= 20; i++) {
  studentsList.push({
    id: String(i),
    name: `Student ${i}`,
    email: `student${i}@example.com`,
    avgRating: "82.5%",
    currentRating: "96%",
    avgPunctuality: `${Math.floor(Math.random() * 40 + 60)}%`,
    attendance: [
      { id: "1", name: `Student ${i}`, day: "Monday", serverTime: "9:00 am", recommendedRating: "80%" },
      { id: "2", name: `Student ${i}`, day: "Wednesday", serverTime: "9:05 am", recommendedRating: "75%" },
      { id: "3", name: `Student ${i}`, day: "Friday", serverTime: "8:55 am", recommendedRating: "85%" },
    ],
  });
}

const tabs = ["Front-End", "Back-End", "Product Design"];

function AttendanceCard({ record }: { record: AttendanceRecord }) {
  return (
    <Card className="border border-border shadow-sm overflow-hidden">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col gap-2 mb-3">
          <Badge 
            variant="outline" 
            className="rounded-full bg-[#ffb703]/10 text-[#08022b] border-[#ffb703] font-medium text-[10px] sm:text-xs px-2 py-0.5 w-fit truncate max-w-full"
          >
            {record.date}
          </Badge>
          <Badge 
            className={`rounded-full text-[10px] sm:text-xs font-medium w-fit px-2 py-0.5 ${
              record.status === "Early" 
                ? "bg-[#34a853]/10 text-[#34a853] border-[#34a853]" 
                : "bg-[#ec1c24]/10 text-[#ec1c24] border-[#ec1c24]"
            }`}
            variant="outline"
          >
            {record.status}
          </Badge>
        </div>
        <div className="space-y-1 text-xs sm:text-sm">
          <p className="text-muted-foreground">
            <span className="block sm:inline">Check in Time:</span>{" "}
            <span className="text-foreground font-medium">{record.checkIn}</span>
          </p>
          <p className="text-muted-foreground">
            <span className="block sm:inline">Check out Time:</span>{" "}
            <span className="text-foreground font-medium">{record.checkOut}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Student Attendance Card for Admin View
function StudentAttendanceCard({ record }: { record: StudentAttendance }) {
  return (
    <Card className="border border-border shadow-sm">
      <CardContent className="p-4 flex flex-col items-center text-center">
        <Avatar className="h-24 w-24 mb-3">
          <AvatarImage src={`/placeholder.svg?height=96&width=96&query=professional%20${record.name}`} />
          <AvatarFallback className="bg-[#ffb703] text-[#08022b] text-lg">
            {record.name.split(" ").map(n => n[0]).join("")}
          </AvatarFallback>
        </Avatar>
        <h3 className="font-semibold text-foreground">{record.name}</h3>
        <p className="text-sm text-muted-foreground">{record.day}</p>
        <p className="text-sm text-muted-foreground">
          Server Time in: <span className="font-medium text-foreground">{record.serverTime}</span>
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Recommended Rating: <span className="font-medium text-foreground">{record.recommendedRating}</span>
        </p>
      </CardContent>
    </Card>
  );
}

// Admin Attendance View Component
function AdminAttendanceView() {
  const [activeTab, setActiveTab] = useState("Front-End");
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState<StudentData[]>(studentsList);

  // Search and filter students
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        // Fetch from API with search query
        const params = new URLSearchParams({
          q: searchQuery,
          type: "students",
          stack: activeTab,
        });
        
        const response = await fetch(`/api/students/search?${params}`);
        const result = await response.json();
        
        // Map API results to our StudentData format with attendance info
        const studentsWithAttendance = result.data.map((student: { id: string; name: string; avgRating: string; currentRating: string }) => {
          const existing = studentsList.find(s => s.name === student.name);
          return existing || {
            id: student.id,
            name: student.name,
            email: "",
            avgRating: student.avgRating,
            currentRating: student.currentRating,
            avgPunctuality: "75%",
            attendance: [
              { id: "1", name: student.name, day: "Monday", serverTime: "9:00 am", recommendedRating: "80%" },
              { id: "2", name: student.name, day: "Wednesday", serverTime: "9:05 am", recommendedRating: "75%" },
              { id: "3", name: student.name, day: "Friday", serverTime: "8:55 am", recommendedRating: "85%" },
            ],
          };
        });
        
        setFilteredStudents(studentsWithAttendance);
      } catch (error) {
        console.error("Search failed:", error);
        // Fallback to local filtering
        const filtered = studentsList.filter(student =>
          student.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredStudents(filtered);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeTab]);

  const handleAcknowledge = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmAcknowledge = () => {
    setShowConfirmDialog(false);
    setShowSuccessDialog(true);
  };

  const handleCloseSuccess = () => {
    setShowSuccessDialog(false);
    setSelectedStudent(null);
  };

  if (selectedStudent) {
    return (
      <div className="space-y-6">
        {/* Back button and title */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedStudent(null)}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Confirm Punctuality</h1>
        </div>

        {/* Attendance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedStudent.attendance.map((record, index) => (
            <StudentAttendanceCard key={index} record={record} />
          ))}
        </div>

        {/* Average Score and Acknowledge Button */}
        <div className="flex flex-col items-center gap-4 py-6">
          <p className="text-lg font-medium text-foreground">
            Average Punctuality Score: <span className="font-bold">{selectedStudent.avgPunctuality}</span>
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
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Acknowledgement</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to acknowledge the punctuality record for {selectedStudent.name}? 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmAcknowledge}
                className="bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]"
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogTitle className="sr-only">Success</DialogTitle>
            <DialogDescription className="sr-only">Punctuality acknowledgement success</DialogDescription>
            <div className="flex flex-col items-center py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#34a853]/10">
                <Check className="h-8 w-8 text-[#34a853]" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">Acknowledged!</h3>
              <p className="mt-2 text-center text-muted-foreground">
                Punctuality record for {selectedStudent.name} has been acknowledged.
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white border-gray-200"
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-[#ffb703] text-[#08022b]"
                : "bg-white text-foreground hover:bg-gray-100 border border-border"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Students Table */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#ffb703]" />
            </div>
          ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-100 hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground whitespace-nowrap">Week</TableHead>
                  <TableHead className="text-xs text-muted-foreground whitespace-nowrap">Name</TableHead>
                  <TableHead className="text-xs text-muted-foreground whitespace-nowrap">Average Rating</TableHead>
                  <TableHead className="text-xs text-muted-foreground whitespace-nowrap text-right">Current Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, index) => (
                    <TableRow
                      key={`${student.id}-${index}`}
                      className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer"
                      onClick={() => setSelectedStudent(student)}
                    >
                      <TableCell className="py-3 text-sm text-muted-foreground">
                        {19 + index}
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-sm font-medium">{student.name}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-sm font-medium text-[#ffb703]">{student.avgRating}</span>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <span className="text-sm font-medium text-[#34a853]">{student.currentRating}</span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No students found matching your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Student Check-in View Component
function StudentCheckInView() {
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus>("idle");
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [filterMonth, setFilterMonth] = useState("all");
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const requestLocationAccess = useCallback(async () => {
    setLocationStatus("requesting");
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });
      
      setLocationData({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
      setLocationStatus("granted");
    } catch (error) {
      console.error("Location error:", error);
      setLocationStatus("denied");
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCheckInStatus("camera");
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (error) {
      console.error("Camera error:", error);
      setCameraError("Unable to access camera. Please ensure camera permissions are granted.");
      setCheckInStatus("error");
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        setCapturedImage(imageData);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        setCheckInStatus("processing");
        setTimeout(() => {
          setCheckInStatus("success");
          setTimeout(() => {
            setShowSuccess(true);
          }, 500);
        }, 1500);
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCheckInStatus("idle");
  }, []);

  const handleTryAgain = useCallback(() => {
    setCheckInStatus("idle");
    setCapturedImage(null);
    setShowSuccess(false);
    setCameraError(null);
  }, []);

  const canCheckIn = locationStatus === "granted";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Check-in</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="bg-[#ffb703]/10 text-[#08022b] border-[#ffb703] px-3 py-1">
            {currentDate}
          </Badge>
          <Badge variant="outline" className="bg-muted px-3 py-1">
            {currentTime}
          </Badge>
        </div>
      </div>

      {/* Location Access Section */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                locationStatus === "granted" 
                  ? "bg-[#34a853]/10" 
                  : locationStatus === "denied" 
                    ? "bg-[#ec1c24]/10" 
                    : "bg-muted"
              }`}>
                <MapPin className={`h-5 w-5 ${
                  locationStatus === "granted" 
                    ? "text-[#34a853]" 
                    : locationStatus === "denied" 
                      ? "text-[#ec1c24]" 
                      : "text-muted-foreground"
                }`} />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Location Access</h3>
                <p className="text-sm text-muted-foreground">
                  {locationStatus === "idle" && "Required for check-in verification"}
                  {locationStatus === "requesting" && "Requesting access..."}
                  {locationStatus === "granted" && "Location access granted"}
                  {locationStatus === "denied" && "Location access denied. Please enable in browser settings."}
                </p>
                {locationData && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Accuracy: {Math.round(locationData.accuracy)}m
                  </p>
                )}
              </div>
            </div>
            
            <Button
              onClick={requestLocationAccess}
              disabled={locationStatus === "requesting" || locationStatus === "granted"}
              className={`w-full sm:w-auto ${
                locationStatus === "granted"
                  ? "bg-[#34a853] hover:bg-[#34a853]/90"
                  : "bg-[#ffb703] hover:bg-[#fb8500]"
              } text-[#08022b]`}
            >
              {locationStatus === "requesting" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {locationStatus === "granted" && (
                <Check className="mr-2 h-4 w-4" />
              )}
              {locationStatus === "idle" && "Confirm Location"}
              {locationStatus === "requesting" && "Requesting..."}
              {locationStatus === "granted" && "Location Confirmed"}
              {locationStatus === "denied" && "Try Again"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Camera Section */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4 sm:p-6">
          {checkInStatus === "idle" && (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 sm:p-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ffb703]/10 mb-4">
                <Camera className="h-8 w-8 text-[#ffb703]" />
              </div>
              <p className="text-foreground font-medium mb-1 text-center">
                Take a Photo to Check In
              </p>
              <p className="text-sm text-muted-foreground mb-6 text-center">
                Position your face clearly in the camera frame
              </p>
              <Button
                onClick={startCamera}
                disabled={!canCheckIn}
                className="bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500] disabled:opacity-50"
              >
                <Camera className="mr-2 h-4 w-4" />
                Open Camera
              </Button>
              {!canCheckIn && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Please confirm your location first
                </p>
              )}
            </div>
          )}

          {checkInStatus === "camera" && (
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-md rounded-lg overflow-hidden bg-black mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto mirror"
                  style={{ transform: "scaleX(-1)" }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full border-4 border-white/50" />
                </div>
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={stopCamera}
                  className="border-border"
                >
                  Cancel
                </Button>
                <Button
                  onClick={capturePhoto}
                  className="bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Capture Photo
                </Button>
              </div>
            </div>
          )}

          {checkInStatus === "processing" && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-border p-8 sm:p-12">
              {capturedImage && (
                <div className="relative w-32 h-32 mb-4 rounded-full overflow-hidden">
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="w-full h-full object-cover"
                    style={{ transform: "scaleX(-1)" }}
                  />
                </div>
              )}
              <Loader2 className="h-8 w-8 animate-spin text-[#ffb703] mb-4" />
              <p className="text-muted-foreground">Verifying...</p>
            </div>
          )}

          {checkInStatus === "success" && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-[#34a853] bg-[#34a853]/5 p-8 sm:p-12">
              {capturedImage && (
                <div className="relative w-32 h-32 mb-4 rounded-full overflow-hidden">
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="w-full h-full object-cover"
                    style={{ transform: "scaleX(-1)" }}
                  />
                  <div className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#34a853]">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#34a853]">
                  <Check className="h-5 w-5 text-white" />
                </div>
                <span className="text-[#34a853] font-medium">Checked in</span>
              </div>
              <Button
                variant="outline"
                onClick={handleTryAgain}
                className="border-[#ffb703] text-[#08022b] hover:bg-[#ffb703]/10"
              >
                Try Again
              </Button>
            </div>
          )}

          {checkInStatus === "error" && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-[#ec1c24] bg-[#ec1c24]/5 p-8 sm:p-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ec1c24]/10 mb-4">
                <X className="h-8 w-8 text-[#ec1c24]" />
              </div>
              <p className="text-[#ec1c24] font-medium mb-2">Camera Error</p>
              {cameraError && (
                <p className="text-sm text-muted-foreground mb-4 text-center max-w-xs">
                  {cameraError}
                </p>
              )}
              <Button
                variant="outline"
                onClick={handleTryAgain}
                className="border-[#ffb703] text-[#08022b] hover:bg-[#ffb703]/10"
              >
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance History Section */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-semibold text-foreground">Attendance History</h2>
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="october">October 2024</SelectItem>
              <SelectItem value="september">September 2024</SelectItem>
              <SelectItem value="august">August 2024</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Attendance Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {attendanceHistory.map((record) => (
            <AttendanceCard key={record.id} record={record} />
          ))}
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogTitle className="sr-only">Check-in Success</DialogTitle>
          <DialogDescription className="sr-only">Your attendance has been recorded</DialogDescription>
          <div className="flex flex-col items-center py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#34a853]/10">
              <Check className="h-8 w-8 text-[#34a853]" />
            </div>
            <h3 className="mt-4 text-xl font-semibold">Checked In!</h3>
            <p className="mt-2 text-center text-muted-foreground">
              Your attendance has been recorded successfully.
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
  );
}

// Main Page Component - Shows different view based on user role
// Student Punctuality View Component - shown when reviewing a specific student from assessments
function StudentPunctualityView({ 
  student, 
  onBack 
}: { 
  student: StudentData; 
  onBack: () => void;
}) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const handleAcknowledge = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmAcknowledge = () => {
    setShowConfirmDialog(false);
    setShowSuccessDialog(true);
  };

  const handleCloseSuccess = () => {
    setShowSuccessDialog(false);
    onBack();
  };

  return (
    <div className="space-y-6">
      {/* Back button and title */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Confirm Punctuality</h1>
      </div>

      {/* Student Info */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <Avatar className="h-14 w-14">
          <AvatarImage src={`/placeholder.svg?height=56&width=56&query=student%20${student.id}`} />
          <AvatarFallback className="bg-[#ffb703] text-lg">
            {student.name.split(" ").map(n => n[0]).join("")}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-foreground">{student.name}</p>
          <p className="text-sm text-muted-foreground">Average Rating: {student.avgRating}</p>
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
          Average Punctuality Score: <span className="font-bold">{student.avgPunctuality}</span>
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
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Acknowledgement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to acknowledge the punctuality record for {student.name}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAcknowledge}
              className="bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogTitle className="sr-only">Acknowledgement Success</DialogTitle>
          <DialogDescription className="sr-only">Punctuality record acknowledged</DialogDescription>
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
  );
}

export default function CheckInPage() {
  const user = useCurrentUser();
  const searchParams = useSearchParams();
  const isAdmin = user?.role === "admin";
  
  // Check if we're reviewing a specific student's attendance
  const studentId = searchParams.get("studentId");
  const studentName = searchParams.get("studentName");
  
  // Find the student from our mock data if reviewing
  const reviewingStudent = studentId ? studentsList.find(s => s.id === studentId) || {
    id: studentId,
    name: studentName ? decodeURIComponent(studentName) : "Unknown Student",
    email: "",
    avgRating: "80%",
    currentRating: "85%",
    avgPunctuality: "75%",
    attendance: [
      { id: "1", name: studentName || "Student", day: "Monday", serverTime: "9:00 am", recommendedRating: "80%" },
      { id: "2", name: studentName || "Student", day: "Wednesday", serverTime: "9:15 am", recommendedRating: "70%" },
      { id: "3", name: studentName || "Student", day: "Friday", serverTime: "8:55 am", recommendedRating: "85%" },
    ],
  } : null;
  
  return (
    <DashboardLayout title="Attendance">
      {isAdmin ? (
        reviewingStudent ? (
          <StudentPunctualityView 
            student={reviewingStudent} 
            onBack={() => window.history.back()} 
          />
        ) : (
          <AdminAttendanceView />
        )
      ) : (
        <StudentCheckInView />
      )}
    </DashboardLayout>
  );
}
