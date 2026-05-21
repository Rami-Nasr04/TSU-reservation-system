import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { NotFoundState } from "@/components/states/NotFoundState"

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh bg-background bg-pinstripe text-foreground">
      <NotFoundState
        onBackToCalendar={() => navigate("/")}
        onReport={() => toast.info("Issue reporting is coming soon.")}
      />
    </div>
  )
}
