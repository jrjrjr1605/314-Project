"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Plus,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const storedUser = localStorage.getItem("user")
const parsedUser = storedUser ? JSON.parse(storedUser) : null

const data = {
  user: {
    name: parsedUser?.username || "Guest",
    email: parsedUser?.role || "No Role",
    avatar: "/avatars/default.jpg",
  },
  teams: [
    {
      name: "Sentinels",
      logo: GalleryVerticalEnd,
    }
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/csr/dashboard/user",
      icon: SquareTerminal,
      isActive: true,
    },
  ],
  projects: [
    {
      name: "Past Completed Requests",
      url: "/csr/completed-requests",
      icon: Map,
    },
    {
        name: "Logs",
        url: "#",
        icon: BookOpen,
    },
    // {
    //   name: "Assign User Profile",
    //   url: "/assign-user-profile",
    //   icon: Bot,
    // },
    // {
    //   name: "Suspend User",
    //   url: "#",
    //   icon: Map,
    // },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>  
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
