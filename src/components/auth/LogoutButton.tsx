'use client'

import { signOut } from 'next-auth/react'

export default function LogoutButton() {
  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Logout failed:', error)
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