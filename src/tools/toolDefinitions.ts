import OpenAI from 'openai'

export const tools: OpenAI.Responses.Tool[] = [
    {
        type: 'function',
        name: 'reply_in_chat',
        strict: true,
        description: 'Send a chat message to the game',
        parameters: {
            type: 'object',
            properties: {
                message: { type: 'string' }
            },
            required: ['message'],
            additionalProperties: false
        }
    },
    {
        type: 'function',
        strict: true,
        name: 'move_to_position',
        description: 'Move the bot near absolute coordinates (pathfind-lite)',
        parameters: {
            type: 'object',
            properties: {
                x: { type: 'number' },
                y: { type: 'number' },
                z: { type: 'number' },
                tolerance: { type: 'number' },
                timeoutMs: { type: 'number' }
            },
            required: ['x', 'y', 'z', 'tolerance', 'timeoutMs'],
            additionalProperties: false
        }
    },
    {
        type: 'function',
        strict: true,
        name: 'place_block',
        description:
            'Place a single block of given type at absolute coordinates',
        parameters: {
            type: 'object',
            properties: {
                blockType: { type: 'string' },
                x: { type: 'number' },
                y: { type: 'number' },
                z: { type: 'number' }
            },
            required: ['blockType', 'x', 'y', 'z'],
            additionalProperties: false
        }
    },
    {
        type: 'function',
        strict: true,
        name: 'start_building',
        description:
            'Start a new building project at origin with structure type, material and size',
        parameters: {
            type: 'object',
            properties: {
                structureType: { type: 'string' },
                material: { type: 'string' },
                startX: { type: 'number' },
                startY: { type: 'number' },
                startZ: { type: 'number' },
                size: {
                    type: 'object',
                    properties: {
                        width: { type: 'number' },
                        depth: { type: 'number' },
                        height: { type: 'number' }
                    },
                    required: ['width', 'depth', 'height'],
                    additionalProperties: false
                },
                name: { type: 'string' }
            },
            required: [
                'structureType',
                'material',
                'startX',
                'startY',
                'startZ',
                'size',
                'name'
            ],
            additionalProperties: false
        }
    },
    {
        type: 'function',
        strict: true,
        name: 'continue_building',
        description:
            'Continue the active building project by placing the next batch of blocks',
        parameters: {
            type: 'object',
            properties: {
                batchSize: { type: 'number' }
            },
            required: ['batchSize'],
            additionalProperties: false
        }
    },
    {
        type: 'function',
        strict: true,
        name: 'check_build_progress',
        description: 'Report the status of the current building project',
        parameters: {
            type: 'object',
            properties: {},
            additionalProperties: false
        }
    },
    {
        type: 'function',
        strict: true,
        name: 'add_task',
        description: 'Добавить новую задачу в список задач бота',
        parameters: {
            type: 'object',
            properties: {
                title: { type: 'string' },
                description: { type: 'string' }
            },
            required: ['title', 'description'],
            additionalProperties: false
        }
    },
    {
        type: 'function',
        strict: true,
        name: 'start_next_task',
        description:
            'Запустить следующую задачу, если активной нет. Не запускает, если уже есть активная',
        parameters: {
            type: 'object',
            properties: {},
            additionalProperties: false
        }
    },
    {
        type: 'function',
        strict: true,
        name: 'complete_active_task',
        description: 'Отметить текущую активную задачу выполненной',
        parameters: {
            type: 'object',
            properties: {},
            additionalProperties: false
        }
    },
    {
        type: 'function',
        strict: true,
        name: 'execute_command',
        description: 'Execute a game command (like /tp, /give, etc.)',
        parameters: {
            type: 'object',
            properties: {
                command: { type: 'string' }
            },
            required: ['command'],
            additionalProperties: false
        }
    },
    {
        type: 'function',
        strict: true,
        name: 'go_to_player',
        description: 'Teleport to a specific player',
        parameters: {
            type: 'object',
            properties: {
                playerName: { type: 'string' }
            },
            required: ['playerName'],
            additionalProperties: false
        }
    },
    {
        type: 'function',
        strict: true,
        name: 'current_position',
        description: 'Get current bot position',
        parameters: {
            type: 'object',
            properties: {},
            additionalProperties: false
        }
    },
    {
        type: 'function',
        strict: true,
        name: 'look_around',
        description: 'Observe the environment and nearby entities/players',
        parameters: {
            type: 'object',
            properties: {},
            additionalProperties: false
        }
    },
    {
        type: 'function',
        strict: true,
        name: 'gather_resources',
        description:
            'Gather nearby resources (blocks) by mining them. Can specify block type or mine nearest blocks',
        parameters: {
            type: 'object',
            properties: {
                blockType: {
                    type: 'string',
                    description:
                        'Type of block to mine, should be exact name as in minecraft name data of block. If not specified, will mine nearest blocks'
                },
                count: {
                    type: 'number',
                    description: 'Number of blocks to mine (default: 10)'
                }
            },
            required: ['blockType', 'count'],
            additionalProperties: false
        }
    },
    {
        type: 'function',
        strict: true,
        name: 'drop_item',
        description:
            'Drop/throw items from inventory. Can specify item name and amount',
        parameters: {
            type: 'object',
            properties: {
                itemName: {
                    type: 'string',
                    description:
                        'Name of the item to drop (e.g., "dirt", "cobblestone", "diamond", etc.). Partial names are supported'
                },
                count: {
                    type: 'number',
                    description:
                        'Number of items to drop (default: drops all of that item)'
                }
            },
            required: ['itemName', 'count'],
            additionalProperties: false
        }
    }
] as const
