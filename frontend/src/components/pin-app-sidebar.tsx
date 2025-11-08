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

const data = { // mock data
  user: {
    name: "shadcn",
    email: "Person-In-Need (PIN)",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Sentinels",
      logo: GalleryVerticalEnd,
    }
  ],
  navMain: [
    {
      title: "My Requests",
      url: "/",
      icon: SquareTerminal,
      isActive: true,
      // items: [
      //   {
      //     title: "User Admin",
      //     url: "#",
      //   },
      //   {
      //     title: "CSR Rep",
      //     url: "#",
      //   },
      //   {
      //     title: "PIN",
      //     url: "#",
      //   },
      //   {
      //     title: "Platform Management",
      //     url: "#",
      //   },
      //   {
      //     title: "Unassigned",
      //     url: "#",
      //   },
      // ],
    },
    // {
    //   title: "Create User Account",
    //   url: "/create-user-account",
    //   icon: Bot,
    // },
    // {
    //   title: "Logs",
    //   url: "#",
    //   icon: BookOpen,
    // },
  ],
  projects: [
    {
      name: "Create Request",
      url: "/pin/create-pin-request",
      icon: Plus,
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
