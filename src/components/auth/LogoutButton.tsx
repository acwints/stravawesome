'use client'

import { signOut } from 'next-auth/react'

export default function LogoutButton() {
  const handleLogout = async () => {
    await signOut({
      callbackUrl: '/auth/signin',
      redirect: true
    })
  }

  return (
    <button
      onClick={handleLogout}
      className="text-red-600 hover:text-red-800 font-medium"
    >
      Sign out
    </button>
  )
} 