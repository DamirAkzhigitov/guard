import OpenAI from 'openai'
import { SYSTEM_PROMPT } from './systemPrompt'
import { Task, BuildProject } from '../types'

const conversation: OpenAI.Responses.ResponseInput = [
    { role: 'system', content: SYSTEM_PROMPT }
]

let mood: string = 'построить деревню'

let tasksCallback: () => Task[] = () => []
let getActiveTaskCallback: () => Task | undefined = () => undefined
let getActiveBuildCallback: () => BuildProject | undefined = () => undefined

export function setTasksCallback(callback: () => Task[]) {
    tasksCallback = callback
}

export function setGetActiveTaskCallback(callback: () => Task | undefined) {
    getActiveTaskCallback = callback
}

export function setGetActiveBuildCallback(
    callback: () => BuildProject | undefined
) {
    getActiveBuildCallback = callback
}

export function getConversation(): OpenAI.Responses.ResponseInput {
    return conversation
}

export function setMood(newMood: string) {
    mood = newMood
}

export function getMood(): string {
    return mood
}

export function addToConversation(role: 'user' | 'assistant', content: string) {
    conversation.push({ role, content })
    if (conversation.length > 30)
        conversation.splice(1, conversation.length - 30)
}

function summarizeTasks(): string {
    const tasks = tasksCallback()
    const summarize = (t: Task) => `- [${t.status}] ${t.title}`
    const active = getActiveTaskCallback()
    const pending = tasks.filter((t) => t.status === 'pending')
    const completed = tasks.filter((t) => t.status === 'completed').slice(-3)
    const lines: string[] = []
    if (active) lines.push('активная задача:', summarize(active))
    if (pending.length) {
        lines.push('ожидают:', ...pending.map(summarize))
    }
    if (completed.length) {
        lines.push('завершены:', ...completed.map(summarize))
    }
    if (!lines.length) return 'задач нет'
    return lines.join('\n')
}

function summarizeActiveBuild(): string {
    const b = getActiveBuildCallback()
    if (!b) return 'нет активного проекта'
    const total = b.blocks.length
    const done = b.placedIndices.size
    const pct = total ? Math.floor((done / total) * 100) : 0
    return `проект: ${b.name} (${b.structureType}) | материал: ${b.material} | прогресс: ${done}/${total} (${pct}%) | origin: ${b.origin.x},${b.origin.y},${b.origin.z}`
}

function buildStatusBlock(): string {
    const rules = [
        'правило: в каждый момент может быть только одна активная задача',
        'правило: если активной нет, можно запустить следующую',
        'правило: можно добавлять новые задачи в любой момент',
        'правило: каждую минуту делай think tick и решай, что дальше'
    ]
    return [
        `настроение: ${mood}`,
        'задачи:',
        summarizeTasks(),
        'стройка:',
        summarizeActiveBuild(),
        'правила:',
        ...rules
    ].join('\n')
}

export function buildContext(): OpenAI.Responses.ResponseInput {
    const context = buildStatusBlock()

    console.log('context: ', JSON.stringify(context, null, 2))

    const ctx: OpenAI.Responses.ResponseInput = [
        ...conversation,
        { role: 'system', content: buildStatusBlock() }
    ]
    return ctx
}
