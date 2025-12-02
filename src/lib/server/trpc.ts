import { initTRPC, TRPCError as TRPCBaseError } from "@trpc/server";
import { verifyJWT } from "./auth/jwt";
import type { TRPCContext } from "./types";

export const createContext = async (opts: {
  req: Request;
}): Promise<TRPCContext> => {
  const authHeader = opts.req.headers.get("authorization");
  let user;

  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7);
      const payload = verifyJWT(token);
      // Map userId from JWT payload to id for context
      user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
      };
    } catch {
      // Invalid token, continue without user
    }
  }

  return {
    user,
    req: opts.req as any,
  };
};

const t = initTRPC.context<typeof createContext>().create();

export const router = t.router;
export const procedure = t.procedure;

export const protectedProcedure = t.procedure.use(async (opts) => {
  if (!opts.ctx.user) {
    throw new TRPCBaseError({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  }
  return opts.next({
    ctx: {
      ...opts.ctx,
      user: opts.ctx.user,
    },
  });
});

export const adminProcedure = protectedProcedure.use(async (opts) => {
  if (opts.ctx.user?.role !== "ADMIN") {
    throw new TRPCBaseError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return opts.next();
});
