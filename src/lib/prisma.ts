import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  // Prefer DATABASE_URL, but support common Vercel/Neon env vars as fallbacks
  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING

  if (!databaseUrl) {
    throw new Error(
      'Prisma: DATABASE_URL is not set. Provide DATABASE_URL (or POSTGRES_PRISMA_URL/POSTGRES_URL) in your environment.'
    )
  }

  return new PrismaClient({
    log: ['error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  })
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

export default prisma 