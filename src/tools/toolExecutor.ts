import type { Bot } from 'mineflayer'
import { Vec3 } from 'vec3'
import { tools as toolDefinitions } from './toolDefinitions'
import { moveToPosition } from '../game/movement'
import { placeBlockAt } from '../game/blocks'
import {
    getActiveBuild,
    createBuildProject,
    completeBuildProject,
    getNextUnplacedIndices
} from '../building/buildManager'
import {
    addTask,
    startNextTask,
    completeActiveTask
} from '../tasks/taskManager'

export type ToolExecutor = (toolName: string, args: any) => Promise<any>

export function getToolDefinitions() {
    return toolDefinitions as any
}

export function createToolExecutor(
    bot: Bot,
    broadcastState: () => void
): ToolExecutor {
    return async function execute(toolName: string, args: any) {
        switch (toolName) {
            case 'reply_in_chat': {
                bot.chat(String(args.message))
                broadcastState()
                return { success: true, message: `Sent: ${args.message}` }
            }

            case 'execute_command': {
                bot.chat(`/${String(args.command)}`)
                broadcastState()
                return {
                    success: true,
                    message: `Executed command: /${args.command}`
                }
            }

            case 'move_to_position': {
                const { x, y, z, tolerance, timeoutMs } = args
                const result = await moveToPosition(
                    bot,
                    { x, y, z },
                    { tolerance, timeoutMs }
                )
                const reached = !!result?.reached
                broadcastState()
                return reached
                    ? { success: true, message: `arrived ${x},${y},${z}` }
                    : {
                          success: false,
                          message: `move timeout or unreachable to ${x},${y},${z}`
                      }
            }

            case 'go_to_player': {
                const liveEntity = () => bot.players?.[args.playerName]?.entity
                const pos = liveEntity()?.position
                const mv = pos
                    ? await moveToPosition(
                          bot,
                          { x: pos.x, y: pos.y, z: pos.z },
                          { tolerance: 2, timeoutMs: 15000 }
                      )
                    : { reached: false }
                const res = mv.reached
                    ? {
                          success: true,
                          message: `Reached ${args.playerName} and stopped`
                      }
                    : {
                          success: false,
                          message: `Stopped moving (player moved away or timeout)`
                      }
                broadcastState()
                return res
            }

            case 'current_position': {
                const position = bot.entity.position
                const res = {
                    success: true,
                    position: {
                        x: Math.floor(position.x),
                        y: Math.floor(position.y),
                        z: Math.floor(position.z)
                    }
                }
                broadcastState()
                return res
            }

            case 'look_around': {
                const nearbyEntities = Object.keys(bot.entities).length
                const nearbyPlayers = Object.keys(bot.players)
                    .filter((name) => name !== bot.username)
                    .map((name) => ({
                        name,
                        distance: bot.players[name].entity
                            ? bot.entity.position.distanceTo(
                                  bot.players[name].entity.position
                              )
                            : null
                    }))
                const res = { success: true, nearbyEntities, nearbyPlayers }
                broadcastState()
                return res
            }
            /*
                gather_resources

                Что бы собрать ресурсы надо:

                1. Посмотреть вокруг и понять что есть рядом
                2. Подумать (ИИ) что из увиденного нужно собрать
                3. Если есть рядом то начать собирать
                4. Если собрано достаточно то остановится

             */

            case 'gather_resources': {
                const count = args.count || 10
                const blockType = args.blockType as string | undefined

                if (blockType) return

                const escaped = blockType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                const pattern = new RegExp(escaped, 'i')

                bot.findBlocks({
                    matching: (block) => pattern.test(block.name),
                    maxDistance: 32
                })

                bot.setControlState('forward', true)
                bot.setControlState('sprint', true)
                bot.setControlState('jump', true)

                let mined = 0
                const searchRadius = 32
                try {
                    for (let i = 0; i < count; i++) {
                        let targetBlock: any

                        if (!targetBlock) break

                        await moveToPosition(
                            bot,
                            {
                                x: targetBlock.position.x,
                                y: targetBlock.position.y,
                                z: targetBlock.position.z
                            },
                            { tolerance: 4, timeoutMs: 20000 }
                        )
                        await bot.lookAt(targetBlock.position)
                        await new Promise((r) => setTimeout(r, 1000))
                        try {
                            await bot.dig(targetBlock)
                            mined++
                            await new Promise((r) => setTimeout(r, 1000))
                        } catch {
                            break
                        }
                    }
                } finally {
                    bot.setControlState('forward', false)
                    bot.setControlState('sprint', false)
                    bot.setControlState('jump', false)
                }
                const res = {
                    success: true,
                    message: `mined ${mined} blocks${blockType ? ` of type ${blockType}` : ''}`
                }
                broadcastState()
                return res
            }

            case 'drop_item': {
                const itemName = String(args.itemName).toLowerCase()
                const itemCount = args.count as number | undefined
                const itemsToDrop = bot.inventory
                    .items()
                    .filter((item) =>
                        item.name.toLowerCase().includes(itemName)
                    )
                if (itemsToDrop.length === 0) {
                    return {
                        success: false,
                        message: `Item "${args.itemName}" not found in inventory`
                    }
                }
                let dropped = 0
                for (const item of itemsToDrop) {
                    const countToDrop = itemCount || item.count
                    const actualCount = Math.min(countToDrop, item.count)
                    try {
                        await bot.toss(item.type, null, actualCount)
                        dropped += actualCount
                        await new Promise((resolve) => setTimeout(resolve, 100))
                    } catch (err: any) {
                        return {
                            success: false,
                            message: `Failed to drop item: ${err?.message}`
                        }
                    }
                    if (itemCount && dropped >= itemCount) break
                }
                const res = {
                    success: true,
                    message: `Dropped ${dropped} of ${args.itemName}`
                }
                broadcastState()
                return res
            }

            case 'place_block': {
                const { blockType, x, y, z } = args
                const res = await placeBlockAt(bot, blockType, x, y, z)
                if (!res.ok)
                    return {
                        success: false,
                        message: `failed to place: ${res.reason}`
                    }
                const active = getActiveBuild()
                if (active) {
                    for (let i = 0; i < active.blocks.length; i++) {
                        const b = active.blocks[i]
                        if (b.x === x && b.y === y && b.z === z)
                            active.placedIndices.add(i)
                    }
                    if (active.placedIndices.size >= active.blocks.length)
                        completeBuildProject(active)
                }
                broadcastState()
                return {
                    success: true,
                    message: `placed ${blockType} at ${x},${y},${z}`
                }
            }

            case 'start_building': {
                const {
                    structureType,
                    material,
                    startX,
                    startY,
                    startZ,
                    size,
                    name
                } = args
                if (getActiveBuild())
                    return { success: false, message: 'build_already_active' }
                const proj = createBuildProject(
                    structureType,
                    material,
                    { x: startX, y: startY, z: startZ },
                    size || {},
                    name
                )
                proj.status = 'active'
                proj.startedAt = Date.now()
                broadcastState()
                return {
                    success: true,
                    message: `build_started: ${proj.name}`,
                    project: {
                        id: proj.id,
                        type: proj.structureType,
                        origin: proj.origin,
                        material: proj.material,
                        total: proj.blocks.length
                    }
                }
            }

            case 'continue_building': {
                const batchSize = Math.max(
                    1,
                    Math.min(50, args?.batchSize || 16)
                )
                const proj = getActiveBuild()
                if (!proj) return { success: false, message: 'no_active_build' }
                let placed = 0
                const indices = getNextUnplacedIndices(proj, batchSize)
                for (const i of indices) {
                    const pb = proj.blocks[i]
                    const existing = bot.blockAt(new Vec3(pb.x, pb.y, pb.z))
                    if (
                        existing &&
                        existing.name !== 'air' &&
                        existing.name !== 'cave_air' &&
                        existing.name !== 'void_air'
                    ) {
                        proj.placedIndices.add(i)
                        continue
                    }
                    const res = await placeBlockAt(
                        bot,
                        pb.type,
                        pb.x,
                        pb.y,
                        pb.z
                    )
                    if (res.ok) {
                        proj.placedIndices.add(i)
                        placed++
                    } else if (res.reason === 'no_material_in_inventory') {
                        broadcastState()
                        return {
                            success: false,
                            message: `materials_missing: need ${proj.material}`,
                            placed
                        }
                    }
                }
                if (proj.placedIndices.size >= proj.blocks.length)
                    completeBuildProject(proj)
                broadcastState()
                return {
                    success: true,
                    message: `placed ${placed}, progress ${proj.placedIndices.size}/${proj.blocks.length}`,
                    placed,
                    total: proj.blocks.length,
                    done: proj.placedIndices.size
                }
            }

            case 'check_build_progress': {
                const proj = getActiveBuild()
                if (!proj) return { success: true, message: 'no_active_build' }
                const total = proj.blocks.length
                const done = proj.placedIndices.size
                const pct = total ? Math.floor((done / total) * 100) : 0
                return {
                    success: true,
                    message: `progress ${done}/${total} (${pct}%) at ${proj.origin.x},${proj.origin.y},${proj.origin.z}`,
                    project: {
                        id: proj.id,
                        name: proj.name,
                        type: proj.structureType,
                        origin: proj.origin,
                        material: proj.material,
                        total,
                        done,
                        pct
                    }
                }
            }

            case 'add_task': {
                const t = addTask(args.title, args.description)
                const res = {
                    success: true,
                    message: `task added: ${t.title}`,
                    task: { id: t.id, title: t.title, status: t.status }
                }
                broadcastState()
                return res
            }

            case 'start_next_task': {
                const res = startNextTask()
                if (!res.ok)
                    return {
                        success: false,
                        message: `cannot start: ${res.reason}`
                    }
                const t = res.task!
                const out = {
                    success: true,
                    message: `started: ${t.title}`,
                    task: { id: t.id, title: t.title, status: t.status }
                }
                broadcastState()
                return out
            }

            case 'complete_active_task': {
                const res = completeActiveTask()
                if (!res.ok)
                    return {
                        success: false,
                        message: `cannot complete: ${res.reason}`
                    }
                const t = res.task!
                const out = {
                    success: true,
                    message: `completed: ${t.title}`,
                    task: { id: t.id, title: t.title, status: t.status }
                }
                broadcastState()
                return out
            }

            default:
                return { success: false, message: `Unknown tool: ${toolName}` }
        }
    }
}
