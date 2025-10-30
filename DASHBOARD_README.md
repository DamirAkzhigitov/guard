# Bot Dashboard

## Overview
A real-time Vue 3 dashboard with Tailwind CSS to monitor your Minecraft bot's state.

## Features
- **Real-time updates** via WebSocket (updates every 1 second)
- **Live state monitoring** of:
  - Bot mood and tasks (active, pending, completed)
  - Bot position, health, and food level
  - Inventory items and counts
  - Nearby players and distances
  - Recent conversation history

## Usage

1. **Start the bot:**
   ```bash
   npm start
   ```

2. **Open dashboard:**
   Navigate to `http://localhost:3000` in your browser

3. **Monitor state:**
   The dashboard will automatically update every second with the bot's current state

## Architecture

- **Server:** Express HTTP server on port 3000 serving static files from `dashboard/public/`
- **WebSocket:** Real-time state updates at `ws://localhost:3000/ws`
- **Frontend:** Single-file Vue 3 app loaded via CDN, no build step required
- **Styling:** Tailwind CSS via CDN

## State Updates

State is broadcasted:
- Every 1 second (interval)
- After processing chat messages
- After tool executions
- During periodic think ticks (every 60 seconds)

