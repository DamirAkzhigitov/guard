import { createDashboardServer } from './dashboard/server'
import {
    createWebSocketServer,
    broadcastState as wsBroadcast
} from './dashboard/websocket'
import { getState } from './dashboard/state'
import { createBotInstance } from './bot/bot'
import { attachCoreHandlers } from './bot/eventHandlers'
import { getToolDefinitions, createToolExecutor } from './tools/toolExecutor'
import { buildContext, addToConversation } from './ai/conversation'
import { callOpenAIWithLogging, setBroadcastStateCallback } from './ai/openai'
import OpenAI from 'openai'

const bot = createBotInstance({
    host: process.env.HOST,
    port: 25689,
    username: 'Vitalik',
    auth: 'offline'
})

const app = createDashboardServer()
const server = app.listen(3001, () => {
    console.log('Dashboard available at http://localhost:3001')
})

function broadcastState() {
    const state = getState(bot)

    wsBroadcast(JSON.stringify(state))
}

createWebSocketServer(server, '/ws')
setBroadcastStateCallback(broadcastState)
setInterval(broadcastState, 1000)

attachCoreHandlers(bot)

const executeTool = createToolExecutor(bot, broadcastState)
const tools = getToolDefinitions()

async function periodicThink() {
    try {
        const tickNote = `[internal]: think_tick ${new Date().toISOString()}`
        addToConversation('user', tickNote)
        const options: OpenAI.Responses.ResponseCreateParamsNonStreaming = {
            model: 'gpt-5-mini-2025-08-07',
            input: buildContext(),
            tools,
            tool_choice: 'auto',
            reasoning: { effort: 'low' }
        }
        const response = await callOpenAIWithLogging(options, 'periodic_think')
        const toolCalls: OpenAI.Responses.ResponseFunctionToolCall[] =
            response.output?.filter((c) => c.type === 'function_call') ?? []
        for (const toolCall of toolCalls) {
            const toolName = toolCall.name
            const args = JSON.parse(toolCall.arguments)
            await executeTool(toolName, args)
        }
        const textResponse = (
            response.output?.filter((c) => c.type === 'message') ?? []
        )
            .map((c) => {
                if (typeof c.content === 'string') return c.content
                if (Array.isArray(c.content))
                    return c.content
                        .map((b) => (typeof b === 'string' ? b : b.text))
                        .join('\n')
                return JSON.stringify(c.content)
            })
            .join('\n')
        if (textResponse.trim()) {
            bot.chat(textResponse)
            addToConversation('assistant', textResponse)
        }
        broadcastState()
    } catch (e) {
        console.error('periodicThink error:', e)
    }
}

bot.once('login', () => {
    try {
        const anyBot: any = bot as any
        const { Default } = anyBot.movement.goals
        anyBot.movement.setGoal(Default)
        anyBot.setControlState('forward', false)
        anyBot.setControlState('sprint', false)
        anyBot.setControlState('jump', false)
        setInterval(periodicThink, 60_000)
    } catch (e) {
        console.warn('movement init failed (optional):', e)
    }
})

bot.on('chat', async (username, message) => {
    if (username === bot.username) return
    addToConversation('user', `[${username}]: ${message}`)
    try {
        const options: OpenAI.Responses.ResponseCreateParamsNonStreaming = {
            model: 'gpt-5-mini-2025-08-07',
            input: buildContext(),
            tools,
            tool_choice: 'auto',
            reasoning: { effort: 'low' }
        }
        const response = await callOpenAIWithLogging(options, 'chat_message')
        const toolCalls: OpenAI.Responses.ResponseFunctionToolCall[] =
            response.output?.filter((c) => c.type === 'function_call') ?? []
        for (const toolCall of toolCalls) {
            const toolName = toolCall.name
            const args = JSON.parse(toolCall.arguments)
            await executeTool(toolName, args)
        }
        const textResponse = (
            response.output?.filter((c) => c.type === 'message') ?? []
        )
            .map((c) => {
                if (typeof c.content === 'string') return c.content
                if (Array.isArray(c.content))
                    return c.content
                        .map((b) => (typeof b === 'string' ? b : b.text))
                        .join('\n')
                return JSON.stringify(c.content)
            })
            .join('\n')
        if (textResponse.trim()) {
            bot.chat(textResponse)
            addToConversation('assistant', textResponse)
        }
        broadcastState()
    } catch (error) {
        console.error('Error processing message:', error)
        bot.chat('ошибка при обработке сообщения')
    }
})
