import { ChevronDown, LogOut, Settings, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
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
  const { user, userGroups, signOut } = useAuth()
  if (!user) return null
  const role = userGroups[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full p-1 pr-1.5 outline-none",
          "focus-visible:ring-2 focus-visible:ring-primary/40",
          className,
        )}
      >
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-foreground text-background text-[11.5px] font-medium tracking-[0.08em]">
          {initialsOf(user.name)}
        </span>
        <ChevronDown className="size-3 text-brand-ink-soft" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-50">
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
        <DropdownMenuItem>
          <User className="size-3.5" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="size-3.5" />
          <span>Settings</span>
        </DropdownMenuItem>
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
