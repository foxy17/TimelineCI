"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { GetStartedButton } from "./get-started-button"
import { cn } from "@/lib/utils"

export function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setIsScrolled(currentScrollY > 80)
    }

    // Add passive listener for better performance
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-out">
      <div
        className={cn(
          "bg-white/90 backdrop-blur-md border border-indigo-100 rounded-full shadow-lg transition-all duration-500 ease-out transform",
          isScrolled 
            ? "px-4 py-2 scale-95 shadow-xl" 
            : "px-6 py-3 w-full max-w-6xl scale-100 shadow-lg"
        )}
        style={{
          width: isScrolled ? "auto" : "100%",
          maxWidth: isScrolled ? "none" : "1152px",
        }}
      >
        <div className="flex items-center justify-between transition-all duration-500 ease-out gap-x-[11px]">
          <Link className="flex items-center justify-center" href="#">
            <Image 
              src="/android-chrome-512x512.png" 
              alt="Timelin-CI Logo" 
              width={36} 
              height={36} 
              className="mr-2 transition-all duration-300 ease-out" 
            />
            <span className="font-bold text-gray-900 transition-all duration-300 ease-out">
              Timelin-CI
            </span>
          </Link>

          <nav
            className={cn(
              "hidden md:flex gap-6 transition-all duration-100 ease-out",
              isScrolled
                ? "opacity-0 w-12 scale-95 pointer-events-none transform translate-x-4"
                : "opacity-100 scale-100 pointer-events-auto transform translate-x-0"
            )}
          >
            <Link
              className="text-sm font-medium hover:text-indigo-600 transition-colors duration-200"
              href="#features"
            >
              Features
            </Link>
          </nav>

          <div className="flex gap-2 transition-all duration-300 ease-out">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "transition-all duration-400 ease-out hidden sm:inline-flex",
                isScrolled
                  ? "opacity-0 scale-90 pointer-events-none w-0 px-0 overflow-hidden"
                  : "opacity-100 scale-100 pointer-events-auto w-auto px-3"
              )}
            >
              Sign In
            </Button>
            <GetStartedButton
              size="sm"
              className={cn(
                "transition-all duration-300 ease-out",
                isScrolled ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm"
              )}
            />
          </div>
        </div>
      </div>
    </header>
  )
} 