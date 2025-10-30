import type { Bot } from 'mineflayer'

export function attachCoreHandlers(bot: Bot, onSpawn?: () => void) {
  bot.on('spawn', () => {
    console.log('Bot spawned!')
    if (onSpawn) onSpawn()
  })

  bot.on('death', () => {
    bot.respawn()
  })

  bot.on('kicked', (reason) => {
    console.log('Kicked:', reason)
  })

  bot.on('error', (error) => {
    console.error('Bot error:', error)
  })
}


