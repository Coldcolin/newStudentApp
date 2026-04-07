"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface StudentCardProps {
  id: string;
  name: string;
  cohort: string;
  avatar?: string;
  status?: "active" | "inactive" | "new";
}

export function StudentCard({ id, name, cohort, avatar, status = "active" }: StudentCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case "active":
        return "bg-[#34a853]/10 text-[#34a853]";
      case "inactive":
        return "bg-[#ec1c24]/10 text-[#ec1c24]";
      case "new":
        return "bg-[#219ebc]/10 text-[#219ebc]";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Link href={`/students/${id}`}>
      <Card className="group cursor-pointer border-none shadow-sm transition-all hover:shadow-md hover:border-[#ffb703]">
        <CardContent className="p-4">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-16 w-16 border-2 border-[#ffb703]">
              <AvatarImage src={avatar || `/placeholder.svg?height=64&width=64&query=student%20${name}`} />
              <AvatarFallback className="bg-[#ffb703] text-[#08022b]">
                {name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <h3 className="mt-3 font-medium text-foreground">{name}</h3>
            <p className="text-sm text-muted-foreground">{cohort}</p>
            <Badge variant="secondary" className={`mt-2 ${getStatusColor()}`}>
              {status}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
