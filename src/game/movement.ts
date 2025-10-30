import { Vec3 } from 'vec3'
import type { Bot } from 'mineflayer'

export async function ensureInRange(
    bot: Bot,
    target: { x: number; y: number; z: number },
    maxDistance = 4
) {
    await moveToPosition(bot, target, { tolerance: maxDistance })
}

export async function moveToPosition(
    bot: Bot,
    target: { x: number; y: number; z: number },
    opts?: { tolerance?: number; timeoutMs?: number }
) {
    const tolerance = Math.max(0.5, opts?.tolerance ?? 2)
    const timeoutMs = Math.max(1000, opts?.timeoutMs ?? 20000)

    const targetVec = new Vec3(target.x, target.y, target.z)
    const startTime = Date.now()

    try {
        bot.setControlState('forward', true)
        bot.setControlState('sprint', true)
        bot.setControlState('jump', true)

        let reached = false
        while (!reached) {
            const pos = bot.entity.position
            const dist = pos.distanceTo(targetVec)
            if (dist <= tolerance) {
                reached = true
                break
            }

            bot.movement.heuristic.get('proximity').target(targetVec)
            const yaw = bot.movement.getYaw(240, 15, 1)
            await bot.movement.steer(yaw)

            await new Promise((r) => setTimeout(r, 100))
            if (Date.now() - startTime > timeoutMs) break
        }

        return {
            reached: bot.entity.position.distanceTo(targetVec) <= tolerance
        }
    } finally {
        bot.setControlState('forward', false)
        bot.setControlState('sprint', false)
        bot.setControlState('jump', false)
    }
}

