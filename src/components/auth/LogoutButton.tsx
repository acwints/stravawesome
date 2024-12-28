'use client'

import { signOut } from 'next-auth/react'
import { useState } from 'react'

export default function LogoutButton() {
  const [showTooltip, setShowTooltip] = useState(false)

  const handleLogout = async () => {
    try {
      await signOut({ 
        redirect: true,
        callbackUrl: '/'
      })
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleLogout}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="text-red-600 hover:text-red-800 font-medium"
      >
        Log out
      </button>
      {showTooltip && (
        <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-sm rounded shadow-lg">
          <p className="mb-2">This will log you out of StravAwesome. You'll remain logged into Strava.</p>
          <a 
            href="https://www.strava.com/logout"
            target="_blank"
            rel="noopener noreferrer"
            className="text-strava-orange hover:text-strava-orange-dark text-xs"
            onClick={(e) => {
              e.stopPropagation()
              handleLogout()
            }}
          >
            Click here to also log out of Strava
          </a>
        </div>
      )}
    </div>
  )
} 