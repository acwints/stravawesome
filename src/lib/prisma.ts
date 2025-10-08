import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  // Prefer DATABASE_URL, but support common Vercel/Supabase env vars as fallbacks
  const rawDatabaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING

  console.log('[Prisma Init] Available env vars:', {
    hasDATABASE_URL: !!process.env.DATABASE_URL,
    hasPOSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
    hasPOSTGRES_URL: !!process.env.POSTGRES_URL,
    hasPOSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
    rawDatabaseUrl: rawDatabaseUrl ? rawDatabaseUrl.replace(/:[^:@]+@/, ':***@') : 'undefined',
    nodeEnv: process.env.NODE_ENV,
  })

  if (!rawDatabaseUrl) {
    throw new Error(
      'Prisma: DATABASE_URL is not set. Provide DATABASE_URL (or POSTGRES_PRISMA_URL/POSTGRES_URL) in your environment.'
    )
  }

  // Normalize URL for Supabase pooled connections and ensure SSL in production
  const normalizeDatabaseUrl = (inputUrl: string): string => {
    try {
      const url = new URL(inputUrl)

      const isSupabase = url.hostname.includes('supabase.com')
      const isPooler = url.hostname.includes('pooler') || /pgbouncer/i.test(url.search)

      console.log('[Prisma Init] Connection details:', {
        hostname: url.hostname,
        port: url.port,
        isSupabase,
        isPooler,
        existingParams: Object.fromEntries(url.searchParams.entries()),
      })

      // Always require SSL in production (many managed Postgres require it)
      if (!url.searchParams.has('sslmode') && process.env.NODE_ENV === 'production') {
        url.searchParams.set('sslmode', 'require')
      }

      // Advise Prisma about PgBouncer when using Supabase pooler
      if (isSupabase && isPooler && !url.searchParams.has('pgbouncer')) {
        url.searchParams.set('pgbouncer', 'true')
      }

      // Reasonable defaults that help avoid transient connection issues
      if (!url.searchParams.has('connect_timeout')) {
        url.searchParams.set('connect_timeout', '15')
      }

      if (!url.searchParams.has('pool_timeout')) {
        url.searchParams.set('pool_timeout', '30')
      }

      const finalUrl = url.toString()
      console.log('[Prisma Init] Final connection URL:', finalUrl.replace(/:[^:@]+@/, ':***@'))

      return finalUrl
    } catch (error) {
      console.error('[Prisma Init] Error parsing database URL:', error)
      // If URL parsing fails, return the original string
      return inputUrl
    }
  }

  const databaseUrl = normalizeDatabaseUrl(rawDatabaseUrl)

  return new PrismaClient({
    log: process.env.NODE_ENV === 'production'
      ? ['error', 'warn']
      : ['query', 'error', 'warn'],
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