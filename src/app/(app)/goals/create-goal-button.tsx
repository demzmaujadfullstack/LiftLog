"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoalFormModal } from "./goal-form-modal";

export function CreateGoalButton({
  exercises,
}: {
  exercises: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={15} /> Goal Baru
      </Button>
      <GoalFormModal
        open={open}
        onClose={() => {
          setOpen(false);
          router.refresh();
        }}
        exercises={exercises}
      />
    </>
  );
}
