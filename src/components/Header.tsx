'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, FilePlus, LayoutDashboard } from 'lucide-react'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  const navLinks = [
    { href: '/', label: '대시보드', icon: LayoutDashboard },
    { href: '/add', label: '영수증 추가', icon: FilePlus },
    { href: '/receipts', label: '모든 영수증', icon: LayoutDashboard }
  ]

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b">
      <div className="container flex items-center justify-between h-16">
        <Link href="/" className="text-xl font-bold">
          ReceiptApp
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        <button 
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="메뉴 열기/닫기"
        >
          {isOpen ? <X /> : <Menu />}
        </button>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg">
            <nav className="flex flex-col p-4">
              {navLinks.map(link => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className="flex items-center gap-3 py-3 px-4 rounded-md hover:bg-gray-100 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <link.icon className="h-5 w-5 text-gray-500"/>
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
} 