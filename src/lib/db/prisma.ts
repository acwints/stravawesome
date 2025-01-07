import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.POSTGRES_PRISMA_URL
      }
    }
  })
}

// Create the initial client without JWT claims
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Helper function to get a client with JWT claims
export async function getPrismaWithAuth() {
  try {
    const session = await getServerSession(authOptions)
    
    if (session?.user?.id) {
      return new PrismaClient({
        datasources: {
          db: {
            url: `${process.env.POSTGRES_PRISMA_URL}?options=set%20request.jwt.claim.sub=${session.user.id}`
          }
        }
      })
    }
  } catch (error) {
    console.error('Error getting session:', error)
  }

  return prisma
} 