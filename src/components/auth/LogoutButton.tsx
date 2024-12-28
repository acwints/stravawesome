'use client'

import { signOut } from 'next-auth/react'

export default function LogoutButton() {
  const handleLogout = async () => {
    try {
      // Clear all cookies and session data
      await signOut({ 
        redirect: false
      })
      
      // Force a hard redirect to clear any cached state
      window.location.href = '/'
    } catch (error) {
      console.error('Logout failed:', error)
      // Force reload as fallback
      window.location.href = '/'
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