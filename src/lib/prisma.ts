import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

const BUILD_TIME_DATABASE_URL = 'postgresql://user:password@localhost:5432/stravawesome_build'

function resolveDatabaseUrl(): string {
  // Prefer DATABASE_URL, but support common Vercel/Supabase env vars as fallbacks.
  const configuredUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING

  if (configuredUrl) {
    return configuredUrl
  }

  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return BUILD_TIME_DATABASE_URL
  }

  if (process.env.NODE_ENV !== 'production') {
    return BUILD_TIME_DATABASE_URL
  }

    throw new Error(
      'Prisma: DATABASE_URL is not set. Provide DATABASE_URL (or POSTGRES_PRISMA_URL/POSTGRES_URL) in your environment.'
    )
}

function normalizeDatabaseUrl(inputUrl: string): string {
    try {
      const url = new URL(inputUrl)

      const isSupabase = url.hostname.includes('supabase.com')
      const isPooler = url.hostname.includes('pooler') || /pgbouncer/i.test(url.search)

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

      return url.toString()
    } catch {
      // If URL parsing fails, return the original string
      return inputUrl
    }
}

const prismaClientSingleton = () => {
  const databaseUrl = normalizeDatabaseUrl(resolveDatabaseUrl())

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

export function getPrismaClient(): PrismaClient {
  if (!globalThis.prisma) {
    globalThis.prisma = prismaClientSingleton()
  }

  return globalThis.prisma
}

const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient()
    const value = Reflect.get(client, prop, receiver)
    return typeof value === 'function' ? value.bind(client) : value
  },
})

export default prisma
