"use client"

import { Menu, UserIcon } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { signOut } from "@/app/(auth)/login/actions"

interface User {
  email?: string
  id: string
  name?: string
}

type NavItem = {
  name: string
  href: string
}

type NavigationProps = {
  user: User | null
}

export default function Navigation({ user }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  // Check if the current path matches the session join pattern
  const isSessionJoinPage = pathname.includes("/join");

  const navigationItems: (string | NavItem)[] =
    isSessionJoinPage
      ? [] 
      : user
        ? [
            { name: "Dashboard", href: "/dashboard" },
            { name: "Calendar", href: "/calendar" },
          ]
        : ["About", "Features", "Documentation"];

  return (
    <nav className="fixed w-full bg-white/80 shadow-lg z-50">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/home" className="text-3xl font-bold mr-8 text-black ml-1">
              Sophia<span className="text-blue-600">.</span>
            </Link>
            <div className="hidden md:flex space-x-6 mt-2">
              {navigationItems.map((item) => (
                <Link
                  key={typeof item === "string" ? item : item.name}
                  href={typeof item === "string" ? `#${item.toLowerCase().replace(/\s+/g, "-")}` : item.href}
                  className={`text-gray-900 hover:text-blue-600 transition-colors duration-200 relative group ${
                    typeof item !== "string" && pathname === item.href ? "text-blue-600" : ""
                  }`}
                >
                  {typeof item === "string" ? item : item.name}
                  <span
                    className={`absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transform transition-transform duration-200 ${
                      typeof item !== "string" && pathname === item.href
                        ? "scale-x-100"
                        : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/assets/Icons/accountIcon.png" />
                      <AvatarFallback>
                        <UserIcon className="h-4 w-4 text-black" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium leading-none">{user.email ? user.email : "Guest Account"}</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <form action="/home" method="POST" className="w-full">
                      <button className="w-full text-left" formAction={signOut}>
                        Sign Out
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : !isSessionJoinPage && (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Link
                  href="/sign-up"
                  className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
            <Menu className="text-gray-900" />
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 backdrop-blur-md bg-white/90">
            {navigationItems.map((item) => (
              <Link
                key={typeof item === "string" ? item : item.name}
                href={typeof item === "string" ? `#${item.toLowerCase().replace(/\s+/g, "-")}` : item.href}
                className={`block px-4 py-2 text-gray-900 hover:text-blue-600 transition-colors duration-200 ${
                  typeof item !== "string" && pathname === item.href ? "text-blue-600 bg-blue-50" : ""
                }`}
              >
                {typeof item === "string" ? item : item.name}
              </Link>
            ))}
            {user ? (
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/assets/Icons/accountIcon.png" />
                      <AvatarFallback>
                        <UserIcon className="h-4 w-4 text-black" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{user.email ? user.email : "Guest Account"}</p>
                  </div>
                </div>
                <div className="mt-3 px-4">
                  <form action="/home" method="POST">
                    <button
                      className="w-full text-left py-2 text-gray-900 hover:bg-blue-50 rounded"
                      formAction={signOut}
                    >
                      Sign Out
                    </button>
                  </form>
                </div>
              </div>
            ) : !isSessionJoinPage && (
              <div className="pt-4 pb-3 border-t border-gray-200 px-4 space-y-2">
                <Link
                  href="/login"
                  className="block w-full text-center py-2 text-gray-900 hover:bg-blue-50 rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="block w-full text-center py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}