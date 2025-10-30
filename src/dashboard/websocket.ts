import { WebSocketServer } from 'ws'
import type { Server } from 'http'

let wss: WebSocketServer | null = null

export function createWebSocketServer(server: Server, path: string = '/ws') {
    wss = new WebSocketServer({ server, path })
    wss.on('connection', (socket) => {
        // Optionally handle pings or send a welcome message
    })
    return wss
}

export function broadcastState(stateJson: string) {
    if (!wss) return
    const payload = JSON.stringify({
        type: 'state',
        payload: JSON.parse(stateJson)
    })
    wss.clients.forEach((c: any) => {
        if (c.readyState === 1) c.send(payload)
    })
}
