"use client";

import { useState } from "react";
import { Check, Vote } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// Mock candidates
const candidates = [
  {
    id: "1",
    name: "Amanda Chukwuma",
    position: "Class Representative",
    manifesto: "I promise to be the voice of every student and ensure our concerns are heard.",
    votes: 45,
  },
  {
    id: "2",
    name: "David Okonkwo",
    position: "Class Representative",
    manifesto: "Together we can make our learning experience better and more engaging.",
    votes: 38,
  },
  {
    id: "3",
    name: "Sarah Williams",
    position: "Class Representative",
    manifesto: "Transparency and accountability will be my guiding principles.",
    votes: 32,
  },
  {
    id: "4",
    name: "Michael Brown",
    position: "Class Representative",
    manifesto: "I will work tirelessly to improve our academic environment.",
    votes: 28,
  },
  {
    id: "5",
    name: "Emily Johnson",
    position: "Class Representative",
    manifesto: "Innovation and creativity are the keys to our success.",
    votes: 25,
  },
  {
    id: "6",
    name: "James Smith",
    position: "Class Representative",
    manifesto: "Every student deserves equal opportunities and representation.",
    votes: 22,
  },
];

export default function VotingPage() {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleVote = () => {
    if (!selectedCandidate) return;
    setShowConfirm(true);
  };

  const confirmVote = () => {
    setShowConfirm(false);
    setHasVoted(true);
    setShowSuccess(true);
    toast.success("Your vote has been cast successfully!");
  };

  const selectedCandidateData = candidates.find((c) => c.id === selectedCandidate);

  return (
    <DashboardLayout title="Cast your Vote">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-muted-foreground">
              Select your preferred candidate for Class Representative
            </p>
          </div>
          {hasVoted ? (
            <Badge className="bg-[#34a853]/10 text-[#34a853]">
              <Check className="mr-1 h-4 w-4" />
              You have voted
            </Badge>
          ) : (
            <Badge className="bg-[#ffb703]/10 text-[#ffb703]">
              <Vote className="mr-1 h-4 w-4" />
              Voting in progress
            </Badge>
          )}
        </div>

        {/* Candidates Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {candidates.map((candidate) => (
            <Card
              key={candidate.id}
              className={`cursor-pointer border-2 shadow-sm transition-all ${
                selectedCandidate === candidate.id
                  ? "border-[#ffb703] bg-[#ffb703]/5"
                  : "border-transparent hover:border-border"
              } ${hasVoted ? "pointer-events-none opacity-70" : ""}`}
              onClick={() => !hasVoted && setSelectedCandidate(candidate.id)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    <Avatar className="h-20 w-20 border-2 border-[#ffb703]">
                      <AvatarImage
                        src={`/placeholder.svg?height=80&width=80&query=candidate%20${candidate.name}`}
                      />
                      <AvatarFallback className="bg-[#ffb703] text-[#08022b] text-lg">
                        {candidate.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    {selectedCandidate === candidate.id && (
                      <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#ffb703]">
                        <Check className="h-4 w-4 text-[#08022b]" />
                      </div>
                    )}
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">
                    {candidate.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {candidate.position}
                  </p>
                  <p className="mt-3 text-sm text-foreground line-clamp-2">
                    {candidate.manifesto}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Vote Button */}
        {!hasVoted && (
          <div className="flex justify-center">
            <Button
              onClick={handleVote}
              disabled={!selectedCandidate}
              className="bg-[#ffb703] px-8 text-[#08022b] hover:bg-[#fb8500]"
            >
              Cast Vote
            </Button>
          </div>
        )}

        {/* Confirm Dialog */}
        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Confirm your Vote</DialogTitle>
              <DialogDescription>
                Are you sure you want to vote for this candidate?
              </DialogDescription>
            </DialogHeader>
            {selectedCandidateData && (
              <div className="flex flex-col items-center py-4">
                <Avatar className="h-16 w-16 border-2 border-[#ffb703]">
                  <AvatarImage
                    src={`/placeholder.svg?height=64&width=64&query=candidate%20${selectedCandidateData.name}`}
                  />
                  <AvatarFallback className="bg-[#ffb703] text-[#08022b]">
                    {selectedCandidateData.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <h3 className="mt-3 font-semibold">{selectedCandidateData.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedCandidateData.position}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>
                Cancel
              </Button>
              <Button
                onClick={confirmVote}
                className="bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]"
              >
                Confirm Vote
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogTitle className="sr-only">Vote Success</DialogTitle>
            <DialogDescription className="sr-only">Your vote has been recorded successfully</DialogDescription>
            <div className="flex flex-col items-center py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#34a853]/10">
                <Check className="h-8 w-8 text-[#34a853]" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">Vote Successful!</h3>
              <p className="mt-2 text-center text-muted-foreground">
                Your vote has been recorded successfully.
              </p>
              <Button
                onClick={() => setShowSuccess(false)}
                className="mt-6 bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]"
              >
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
