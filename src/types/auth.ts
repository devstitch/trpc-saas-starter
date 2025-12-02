export interface User {
  id: string
  email: string
  name: string
  role: "USER" | "ADMIN"
  createdAt: string
}
