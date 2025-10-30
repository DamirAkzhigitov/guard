import type { Bot } from 'mineflayer'
import type { BotState } from '../types'
import { getAllTasks, getActiveTask } from '../tasks/taskManager'
import { getBuildStateSnapshot } from '../building/buildManager'
import { getConversation } from '../ai/conversation'
import { getMood } from '../ai/conversation'
import { getOpenAICallLogs } from '../ai/openai'

export function getState(bot: Bot): BotState {
    const position = bot?.entity?.position
    const inv = (bot as any)?.inventory?.items?.() ?? []
    const conversation = getConversation()
    const openAICallLogs = getOpenAICallLogs()
    const tasks = getAllTasks()

    return {
        mood: getMood(),
        build: getBuildStateSnapshot(),
        tasks: {
            active: getActiveTask() ?? null,
            pending: tasks.filter((t) => t.status === 'pending'),
            completed: tasks.filter((t) => t.status === 'completed').slice(-10)
        },
        conversation: (conversation as any).slice(-30),
        openAILogs: openAICallLogs.slice(-20),
        bot: {
            position: position
                ? {
                      x: Math.floor(position.x),
                      y: Math.floor(position.y),
                      z: Math.floor(position.z)
                  }
                : null,
            health: (bot as any)?.health ?? null,
            food: (bot as any)?.food ?? null
        },
        inventory: inv.map((i: any) => ({ name: i.name, count: i.count })),
        nearbyPlayers: Object.keys(bot.players)
            .filter((n) => n !== bot.username)
            .map((n) => ({
                name: n,
                distance: bot.players[n].entity
                    ? bot.entity.position.distanceTo(
                          bot.players[n].entity.position
                      )
                    : null
            }))
    }
}
