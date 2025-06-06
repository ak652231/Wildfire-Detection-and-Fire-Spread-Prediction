import React from 'react';
import { Button } from "@/components/ui/button"
import { Flame, Bell, User, Menu, Search } from "lucide-react"

export function Header() {
  return (
    <header className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Flame className="h-8 w-8 text-orange-500 mr-2" />
            <h1 className="text-2xl font-bold text-white">
              <span className="text-orange-500">Fire</span>Watch
            </h1>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <nav>
              <ul className="flex space-x-6">
                <li>
                  <a href="#" className="text-white hover:text-orange-400 font-medium">
                    Dashboard
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-orange-400">
                    Historical Data
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-orange-400">
                    Risk Assessment
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-orange-400">
                    Reports
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full border-gray-600 hidden md:flex">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

