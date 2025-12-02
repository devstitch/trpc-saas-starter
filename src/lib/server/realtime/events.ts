import { EventEmitter } from "events"

export type RealtimeEvent =
  | { type: "PROJECT_CREATED"; data: { projectId: string; organizationId: string; name: string } }
  | { type: "PROJECT_UPDATED"; data: { projectId: string; organizationId: string; changes: Record<string, any> } }
  | { type: "PROJECT_DELETED"; data: { projectId: string; organizationId: string } }
  | { type: "USER_JOINED"; data: { userId: string; organizationId: string; email: string } }
  | { type: "USER_LEFT"; data: { userId: string; organizationId: string } }
  | { type: "SUBSCRIPTION_UPDATED"; data: { organizationId: string; plan: string } }

class RealtimeEventEmitter extends EventEmitter {
  private static instance: RealtimeEventEmitter

  public static getInstance(): RealtimeEventEmitter {
    if (!this.instance) {
      this.instance = new RealtimeEventEmitter()
    }
    return this.instance
  }

  public emit(event: RealtimeEvent): boolean {
    return super.emit(event.type, event.data)
  }

  public onEvent(type: string, callback: (data: any) => void): void {
    this.on(type, callback)
  }

  public offEvent(type: string, callback: (data: any) => void): void {
    this.off(type, callback)
  }
}

export const realtimeEvents = RealtimeEventEmitter.getInstance()
