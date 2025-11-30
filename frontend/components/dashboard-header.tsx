"use client"

import { useState } from "react"
import { Settings, Sun, Moon, Plus } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function DashboardHeader() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("dark")
  }

  const isActive = (path: string) => pathname === path

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and branding */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/dashboard")}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">ML</span>
            </div>
            <h1 className="text-xl font-bold text-foreground hidden sm:block">ML Model Manager</h1>
          </div>

          {/* Navigation menu */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => router.push("/dashboard")}
              className={`text-sm font-medium transition-colors ${
                isActive("/dashboard") 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tableau de bord
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className={`text-sm font-medium transition-colors ${
                isActive("/dashboard") 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Modèles
            </button>
            <button
              onClick={() => router.push("/train")}
              className={`text-sm font-medium transition-colors ${
                isActive("/train") 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Entraîner
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Paramètres
            </button>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* Add Model button - visible on dashboard */}
            {isActive("/dashboard") && (
              <Button 
                onClick={() => router.push("/train")}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Ajouter un modèle</span>
                <span className="sm:hidden">Ajouter</span>
              </Button>
            )}

            {/* Dark mode toggle */}
            {/* <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="rounded-full"
              title="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button> */}
            <ThemeToggle />

            {/* Settings dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Settings className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>Profil</DropdownMenuItem>
                <DropdownMenuItem>Paramètres</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">Déconnexion</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
