export type TaskStatus = 'pending' | 'active' | 'completed' | 'cancelled'

export type Task = {
    id: string
    title: string
    description?: string
    status: TaskStatus
    createdAt: number
    startedAt?: number
    completedAt?: number
}

export type BuildStatus = 'pending' | 'active' | 'completed' | 'cancelled'

export type PlannedBlock = { x: number; y: number; z: number; type: string }

export type BuildProject = {
    id: string
    name: string
    structureType: string
    origin: { x: number; y: number; z: number }
    material: string
    blocks: PlannedBlock[]
    placedIndices: Set<number>
    status: BuildStatus
    createdAt: number
    startedAt?: number
    completedAt?: number
}

export type OpenAICallLog = {
    id: string
    timestamp: string
    type: 'periodic_think' | 'chat_message'
    request: {
        model: string
        inputLength: number
        inputPreview: string
        toolsCount: number
        toolChoice: string
        reasoning: any
    }
    response: {
        outputType: string
        toolCallsCount: number
        textContent: string
        contentPreview: string
    }
    duration: number
}

export type BotState = {
    mood: string
    build: {
        id: string
        name: string
        type: string
        origin: { x: number; y: number; z: number }
        material: string
        total: number
        done: number
    } | null
    tasks: {
        active: Task | null
        pending: Task[]
        completed: Task[]
    }
    conversation: any[]
    openAILogs: OpenAICallLog[]
    bot: {
        position: { x: number; y: number; z: number } | null
        health: number | null
        food: number | null
    }
    inventory: Array<{ name: string; count: number }>
    nearbyPlayers: Array<{ name: string; distance: number | null }>
}

