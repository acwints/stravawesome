'use client'

import { signOut } from 'next-auth/react'

export default function LogoutButton() {
  const handleLogout = async () => {
    try {
      // Force a complete session cleanup and redirect
      await fetch('/api/auth/signout', { method: 'POST' })
      window.location.href = '/auth/signin'
    } catch (error) {
      console.error('Logout failed:', error)
      // Force redirect as fallback
      window.location.href = '/auth/signin'
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="text-red-600 hover:text-red-800 font-medium"
    >
      Log out
    </button>
  )
} 