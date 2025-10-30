import * as mineflayer from 'mineflayer'
import * as movement from 'mineflayer-movement'
import type { Bot } from 'mineflayer'

export type BotConfig = {
  host: string
  port: number
  username: string
  auth?: 'mojang' | 'microsoft' | 'offline'
}

export function createBotInstance(config: BotConfig): Bot {
  const bot = mineflayer.createBot({
    host: config.host,
    port: config.port,
    username: config.username,
    auth: config.auth || 'offline',
  })
  bot.loadPlugin(movement.plugin)
  return bot
}


