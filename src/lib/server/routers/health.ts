import { procedure, router } from "../trpc"

export default router({
  check: procedure.query(async () => {
    return { status: "ok", timestamp: new Date() }
  }),
})
