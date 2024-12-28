import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.redirect(new URL('/api/auth/signout?callbackUrl=/', process.env.NEXTAUTH_URL))
}

export async function POST() {
  return NextResponse.redirect(new URL('/api/auth/signout?callbackUrl=/', process.env.NEXTAUTH_URL))
} 