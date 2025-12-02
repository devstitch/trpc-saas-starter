import { protectedProcedure, router } from "../trpc"
import { z } from "zod"
import { observable } from "@trpc/server/observable"
import { realtimeEvents } from "../realtime/events"

export const realtimeRouter = router({
  projectUpdates: protectedProcedure.input(z.object({ organizationId: z.string() })).subscription(({ input }) => {
    return observable((emit) => {
      const handleProjectCreated = (data: any) => {
        if (data.organizationId === input.organizationId) {
          emit.next({
            type: "PROJECT_CREATED",
            data,
          })
        }
      }

      const handleProjectUpdated = (data: any) => {
        if (data.organizationId === input.organizationId) {
          emit.next({
            type: "PROJECT_UPDATED",
            data,
          })
        }
      }

      const handleProjectDeleted = (data: any) => {
        if (data.organizationId === input.organizationId) {
          emit.next({
            type: "PROJECT_DELETED",
            data,
          })
        }
      }

      // Subscribe to events
      realtimeEvents.on("PROJECT_CREATED", handleProjectCreated)
      realtimeEvents.on("PROJECT_UPDATED", handleProjectUpdated)
      realtimeEvents.on("PROJECT_DELETED", handleProjectDeleted)

      // Cleanup on unsubscribe
      return () => {
        realtimeEvents.off("PROJECT_CREATED", handleProjectCreated)
        realtimeEvents.off("PROJECT_UPDATED", handleProjectUpdated)
        realtimeEvents.off("PROJECT_DELETED", handleProjectDeleted)
      }
    })
  }),

  organizationEvents: protectedProcedure.input(z.object({ organizationId: z.string() })).subscription(({ input }) => {
    return observable((emit) => {
      const handleUserJoined = (data: any) => {
        if (data.organizationId === input.organizationId) {
          emit.next({
            type: "USER_JOINED",
            data,
          })
        }
      }

      const handleUserLeft = (data: any) => {
        if (data.organizationId === input.organizationId) {
          emit.next({
            type: "USER_LEFT",
            data,
          })
        }
      }

      const handleSubscriptionUpdated = (data: any) => {
        if (data.organizationId === input.organizationId) {
          emit.next({
            type: "SUBSCRIPTION_UPDATED",
            data,
          })
        }
      }

      realtimeEvents.on("USER_JOINED", handleUserJoined)
      realtimeEvents.on("USER_LEFT", handleUserLeft)
      realtimeEvents.on("SUBSCRIPTION_UPDATED", handleSubscriptionUpdated)

      return () => {
        realtimeEvents.off("USER_JOINED", handleUserJoined)
        realtimeEvents.off("USER_LEFT", handleUserLeft)
        realtimeEvents.off("SUBSCRIPTION_UPDATED", handleSubscriptionUpdated)
      }
    })
  }),
})
