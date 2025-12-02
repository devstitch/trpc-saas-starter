import { protectedProcedure, router } from "../trpc"
import { prisma } from "../db"
import { TRPCError } from "@trpc/server"
import crypto from "crypto"

export const apiKeysRouter = router({
  getApiKey: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        apiKey: true,
      },
    })

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      })
    }

    // Generate API key if it doesn't exist
    if (!user.apiKey) {
      // Generate a unique API key (check for collisions, though extremely unlikely)
      let newApiKey: string
      let attempts = 0
      const maxAttempts = 10
      
      do {
        newApiKey = `trpc_${crypto.randomBytes(16).toString("hex")}_${crypto.randomBytes(8).toString("hex")}`
        const existing = await prisma.user.findFirst({
          where: { apiKey: newApiKey },
        })
        if (!existing) break
        attempts++
      } while (attempts < maxAttempts)
      
      if (attempts >= maxAttempts) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate unique API key",
        })
      }
      
      await prisma.user.update({
        where: { id: ctx.user.id },
        data: { apiKey: newApiKey },
      })
      return { apiKey: newApiKey }
    }

    return { apiKey: user.apiKey }
  }),

  regenerateApiKey: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      })
    }

    // Generate a unique API key (check for collisions, though extremely unlikely)
    let newApiKey: string
    let attempts = 0
    const maxAttempts = 10
    
    do {
      newApiKey = `trpc_${crypto.randomBytes(16).toString("hex")}_${crypto.randomBytes(8).toString("hex")}`
      const existing = await prisma.user.findFirst({
        where: { apiKey: newApiKey },
      })
      if (!existing) break
      attempts++
    } while (attempts < maxAttempts)
    
    if (attempts >= maxAttempts) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate unique API key",
      })
    }
    
    await prisma.user.update({
      where: { id: ctx.user.id },
      data: { apiKey: newApiKey },
    })

    return { apiKey: newApiKey }
  }),
})

