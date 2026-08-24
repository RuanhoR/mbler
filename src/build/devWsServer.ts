import { WebSocketServer, WebSocket } from 'ws'

interface WsClient {
  socket: WebSocket
  id: string
}

export class DevWsServer {
  private wss: WebSocketServer | null = null
  private clients: Map<string, WsClient> = new Map()
  private port: number
  private nextId = 0

  constructor(port = 19145) {
    this.port = port
  }

  start(): void {
    if (this.wss) return
    this.wss = new WebSocketServer({ port: this.port })
    this.wss.on('connection', (ws: WebSocket) => {
      const id = `client_${++this.nextId}`
      this.clients.set(id, { socket: ws, id })
      ws.on('close', () => this.clients.delete(id))
      ws.on('error', () => this.clients.delete(id))
    })
      console.log(
      `[dev-ws] WS listening on :${this.port} — run in game: /connect ws://localhost:${this.port}`
    )
  }

  stop(): void {
    for (const [, c] of this.clients) c.socket.close()
    this.clients.clear()
    this.wss?.close()
    this.wss = null
  }

  get clientCount(): number {
    return this.clients.size
  }

  /** Send a slash command to all connected MC instances. */
  private broadcastCommand(commandLine: string): void {
    const msg = JSON.stringify({
      body: {
        commandLine,
        origin: { type: 'player' },
      },
      header: {
        requestId: `mbler-${Date.now()}`,
        messagePurpose: 'commandRequest',
      },
    })
    for (const [, c] of this.clients) {
      if (c.socket.readyState === WebSocket.OPEN) {
        c.socket.send(msg)
      }
    }
  }

  /**
   * Called after a watch-mode rebuild finishes.
   * @param changedFiles - relative paths that triggered the rebuild
   */
  onBuildComplete(changedFiles: string[]): void {
    if (this.clients.size === 0) return

    const needsFullReload = changedFiles.some(
      f =>
        !f.includes('scripts/') &&
        !f.endsWith('.ts') &&
        !f.endsWith('.js') &&
        !f.endsWith('.mcx') &&
        !f.endsWith('.mjs')
    )

    if (needsFullReload) {
      this.broadcastCommand('/reload')
      console.log(
        `[dev-ws] resource/manifest change detected → /reload sent to ${this.clients.size} client(s)`
      )
    } else {
      this.broadcastCommand('/script profiler start')
      this.broadcastCommand('/script profiler stop')
      console.log(
        `[dev-ws] script change → soft reload sent to ${this.clients.size} client(s)`
      )
    }
  }
}
