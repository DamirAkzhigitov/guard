import { Task } from '../types'

const tasks: Task[] = []

export function getAllTasks(): Task[] {
    return tasks
}

export function getActiveTask(): Task | undefined {
    return tasks.find((t) => t.status === 'active')
}

export function getNextPendingTask(): Task | undefined {
    return tasks.find((t) => t.status === 'pending')
}

export function addTask(title: string, description?: string): Task {
    const task: Task = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        description,
        status: 'pending',
        createdAt: Date.now()
    }
    tasks.push(task)
    return task
}

export function startNextTask(): { ok: boolean; reason?: string; task?: Task } {
    if (getActiveTask()) return { ok: false, reason: 'already_active' }
    const next = getNextPendingTask()
    if (!next) return { ok: false, reason: 'no_pending' }
    next.status = 'active'
    next.startedAt = Date.now()
    return { ok: true, task: next }
}

export function completeActiveTask(): {
    ok: boolean
    reason?: string
    task?: Task
} {
    const active = getActiveTask()
    if (!active) return { ok: false, reason: 'no_active' }
    active.status = 'completed'
    active.completedAt = Date.now()
    return { ok: true, task: active }
}

export function summarizeTasks(): string {
    const summarize = (t: Task) => `- [${t.status}] ${t.title}`
    const active = getActiveTask()
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
