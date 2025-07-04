import Link from "next/link"

export function LandingFooter() {
  return (
    <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-indigo-100 bg-white/80 backdrop-blur-sm">
      <p className="text-xs text-gray-500">© 2024 Timelin-CI. All rights reserved.</p>
      <nav className="sm:ml-auto flex gap-4 sm:gap-6">
        <Link className="text-xs hover:text-indigo-600 transition-colors" href="#">
          Terms of Service
        </Link>
        <Link className="text-xs hover:text-indigo-600 transition-colors" href="#">
          Privacy Policy
        </Link>
        <Link className="text-xs hover:text-indigo-600 transition-colors" href="#">
          Documentation
        </Link>
      </nav>
    </footer>
  )
} 