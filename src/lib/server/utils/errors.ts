export class TRPCError extends Error {
  constructor(
    public code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "BAD_REQUEST" | "INTERNAL_SERVER_ERROR",
    message: string,
  ) {
    super(message)
    this.name = "TRPCError"
  }
}

export const Errors = {
  UNAUTHORIZED: () => new TRPCError("UNAUTHORIZED", "Unauthorized"),
  FORBIDDEN: () => new TRPCError("FORBIDDEN", "Forbidden"),
  NOT_FOUND: () => new TRPCError("NOT_FOUND", "Not found"),
  BAD_REQUEST: (msg: string) => new TRPCError("BAD_REQUEST", msg),
  INTERNAL_SERVER_ERROR: () => new TRPCError("INTERNAL_SERVER_ERROR", "Internal server error"),
}
