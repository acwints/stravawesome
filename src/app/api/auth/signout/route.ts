import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export async function GET() {
  const cookieStore = cookies()
  
  // Clear all auth-related cookies
  const allCookies = cookieStore.getAll()
  allCookies.forEach((cookie: ResponseCookie) => {
    if (cookie.name.startsWith('next-auth')) {
      cookieStore.delete(cookie.name)
    }
  })

  return NextResponse.redirect(new URL('/', process.env.NEXTAUTH_URL))
}

export async function POST() {
  const cookieStore = cookies()
  
  // Clear all auth-related cookies
  const allCookies = cookieStore.getAll()
  allCookies.forEach((cookie: ResponseCookie) => {
    if (cookie.name.startsWith('next-auth')) {
      cookieStore.delete(cookie.name)
    }
  })

  return NextResponse.redirect(new URL('/', process.env.NEXTAUTH_URL))
} 