import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

async function createTursoClient(): Promise<PrismaClient> {
  const { PrismaLibSQL } = await import('@prisma/adapter-libsql')
  const { createClient } = await import('@libsql/client/web')

  const libsql = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  })
  const adapter = new PrismaLibSQL(libsql)
  return new PrismaClient({ adapter })
}

function createLocalClient(): PrismaClient {
  return new PrismaClient()
}

// For Turso, we need to create the client lazily
let prismaPromise: Promise<PrismaClient> | null = null

export async function getPrisma(): Promise<PrismaClient> {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  if (!prismaPromise) {
    if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
      prismaPromise = createTursoClient()
    } else {
      prismaPromise = Promise.resolve(createLocalClient())
    }
  }

  const client = await prismaPromise
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
  }

  return client
}
