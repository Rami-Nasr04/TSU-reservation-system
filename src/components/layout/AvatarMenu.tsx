import { useNavigate } from "react-router-dom"
import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  LogOut,
  Settings,
  Users,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { operationalDate } from "@/lib/dates"
import { useAuth, type UserRole } from "@/contexts/AuthContext"

interface AvatarMenuProps {
  className?: string
}

const ROLE_LABEL: Record<UserRole, string> = {
  manager: "Manager",
  supervisor: "Supervisor",
  host: "Host",
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?"
}

export function AvatarMenu({ className }: AvatarMenuProps) {
  const navigate = useNavigate()
  const { user, userGroups, signOut, hasRole } = useAuth()
  if (!user) return null
  const role = userGroups[0]
  const isManager = hasRole("manager")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full p-1 pr-1.5 outline-none transition-colors duration-150",
          "hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-primary/40",
          className,
        )}
        aria-label="Open user menu"
      >
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-foreground text-background text-[11.5px] font-medium tracking-[0.08em]">
          {initialsOf(user.name)}
        </span>
        <ChevronDown className="size-3 text-brand-ink-soft" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-48">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-[13px] font-normal text-foreground">
            {user.name}
          </span>
          {role && (
            <span className="text-[11px] text-brand-ink-mute">
              {ROLE_LABEL[role]}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate(`/day/${operationalDate()}`)}>
          <CalendarDays className="size-3.5" />
          <span>Dayboard</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/")}>
          <CalendarRange className="size-3.5" />
          <span>Calendar</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/customers")}>
          <Users className="size-3.5" />
          <span>Customers</span>
        </DropdownMenuItem>
        {isManager && (
          <DropdownMenuItem onClick={() => navigate("/analytics")}>
            <BarChart3 className="size-3.5" />
            <span>Analytics</span>
          </DropdownMenuItem>
        )}
        {isManager && (
          <DropdownMenuItem onClick={() => navigate("/settings")}>
            <Settings className="size-3.5" />
            <span>Settings</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut()}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="size-3.5" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
