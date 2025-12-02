export const auditMiddleware = async (opts: any) => {
  const result = await opts.next()

  // Only log mutations, not queries
  if (opts.path && opts.type === "mutation" && result.ok) {
    // The audit logging happens inside individual mutation handlers
    // This middleware can be extended for automatic logging
  }

  return result
}
