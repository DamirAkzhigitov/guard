import OpenAI from 'openai'
import { OpenAICallLog } from '../types'

export const openai = new OpenAI({
    apiKey: ''
})

const MAX_LOGS = 50
const openAICallLogs: OpenAICallLog[] = []

let broadcastStateCallback: (() => void) | null = null

export function setBroadcastStateCallback(callback: () => void) {
    broadcastStateCallback = callback
}

export function getOpenAICallLogs(): OpenAICallLog[] {
    return openAICallLogs
}

function logOpenAICall(
    log: Omit<OpenAICallLog, 'duration'>,
    duration: number
): void {
    const fullLog: OpenAICallLog = { ...log, duration }
    openAICallLogs.push(fullLog)
    if (openAICallLogs.length > MAX_LOGS) {
        openAICallLogs.shift()
    }

    // Console logging in readable format
    console.log('\n========================================')
    console.log(`OpenAI API Call [${log.type}]`)
    console.log('----------------------------------------')
    console.log(`Timestamp: ${log.timestamp}`)
    console.log(`Duration: ${duration}ms`)
    console.log('\n--- REQUEST ---')
    console.log(`Model: ${log.request.model}`)
    console.log(`Input Length: ${log.request.inputLength} messages`)
    console.log(`Tools: ${log.request.toolsCount}`)
    console.log(`Tool Choice: ${log.request.toolChoice}`)
    console.log(`Reasoning: ${JSON.stringify(log.request.reasoning)}`)
    console.log('\n--- INPUT PREVIEW ---')
    console.log(log.request.inputPreview)
    console.log('\n--- RESPONSE ---')
    console.log(`Output Type: ${log.response.outputType}`)
    console.log(`Tool Calls: ${log.response.toolCallsCount}`)
    if (log.response.textContent) {
        console.log('\n--- TEXT CONTENT ---')
        console.log(log.response.textContent)
    }
    console.log('\n--- CONTENT PREVIEW ---')
    console.log(log.response.contentPreview)
    console.log('========================================\n')

    if (broadcastStateCallback) {
        broadcastStateCallback()
    }
}

export async function callOpenAIWithLogging(
    options: OpenAI.Responses.ResponseCreateParamsNonStreaming,
    type: 'periodic_think' | 'chat_message'
): Promise<OpenAI.Responses.Response> {
    const startTime = Date.now()
    const logId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    // Prepare request log
    const inputStr = JSON.stringify(options.input, null, 2)
    const inputPreview =
        inputStr.length > 1000 ? inputStr.slice(0, 1000) + '...' : inputStr

    const toolsCount = Array.isArray(options.tools) ? options.tools.length : 0

    // Make the API call
    const response = await openai.responses.create(options)

    const duration = Date.now() - startTime

    // Extract response info
    const toolCalls =
        response.output?.filter((c: any) => c.type === 'function_call') ?? []
    const messages =
        response.output?.filter((c: any) => c.type === 'message') ?? []

    let textContent = ''
    for (const msg of messages) {
        const msgAny = msg as any
        if (typeof msgAny.content === 'string') {
            textContent += msgAny.content
        } else if (Array.isArray(msgAny.content)) {
            textContent += msgAny.content
                .map((block) =>
                    typeof block === 'string' ? block : (block as any).text
                )
                .join('\n')
        }
    }

    const contentStr = JSON.stringify(response.output, null, 2)
    const contentPreview =
        contentStr.length > 1000
            ? contentStr.slice(0, 1000) + '...'
            : contentStr

    // Log the call
    logOpenAICall(
        {
            id: logId,
            timestamp: new Date().toISOString(),
            type,
            request: {
                model: String(options.model),
                inputLength: Array.isArray(options.input)
                    ? options.input.length
                    : 0,
                inputPreview,
                toolsCount,
                toolChoice: String(options.tool_choice || 'auto'),
                reasoning: options.reasoning || null
            },
            response: {
                outputType: response.output ? 'present' : 'empty',
                toolCallsCount: toolCalls.length,
                textContent: textContent,
                contentPreview
            }
        },
        duration
    )

    return response
}
