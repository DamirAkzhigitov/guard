import express from 'express'

export function createDashboardServer() {
    const app = express()
    app.use(express.static('dashboard/public'))
    return app
}

