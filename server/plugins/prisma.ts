import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Only export the plugin if we're in a Nitro environment
let defaultExport: any = undefined
if (typeof defineNitroPlugin !== 'undefined') {
  defaultExport = defineNitroPlugin(() => {
    // This ensures Prisma is available in Nitro
  })
}

export default defaultExport
