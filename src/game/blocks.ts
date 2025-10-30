import { Vec3 } from 'vec3'
import type { Bot } from 'mineflayer'
import { equipBlock } from './inventory'
import { ensureInRange } from './movement'

export function blockAt(bot: Bot, x: number, y: number, z: number) {
    return bot.blockAt(new Vec3(x, y, z))
}

export function isAirLike(block: any): boolean {
    if (!block) return true
    return (
        block.name === 'air' ||
        block.name === 'cave_air' ||
        block.name === 'void_air'
    )
}

export function findPlaceSupport(
    bot: Bot,
    x: number,
    y: number,
    z: number
): { ref: any; face: Vec3 } | null {
    const below = blockAt(bot, x, y - 1, z)
    if (below && !isAirLike(below))
        return { ref: below, face: new Vec3(0, 1, 0) }
    const left = blockAt(bot, x - 1, y, z)
    if (left && !isAirLike(left)) return { ref: left, face: new Vec3(1, 0, 0) }
    const right = blockAt(bot, x + 1, y, z)
    if (right && !isAirLike(right))
        return { ref: right, face: new Vec3(-1, 0, 0) }
    const front = blockAt(bot, x, y, z - 1)
    if (front && !isAirLike(front))
        return { ref: front, face: new Vec3(0, 0, 1) }
    const back = blockAt(bot, x, y, z + 1)
    if (back && !isAirLike(back)) return { ref: back, face: new Vec3(0, 0, -1) }
    const above = blockAt(bot, x, y + 1, z)
    if (above && !isAirLike(above))
        return { ref: above, face: new Vec3(0, -1, 0) }
    return null
}

export async function placeBlockAt(
    bot: Bot,
    material: string,
    x: number,
    y: number,
    z: number
): Promise<{ ok: boolean; reason?: string }> {
    const existing = blockAt(bot, x, y, z)
    if (existing && !isAirLike(existing)) return { ok: true }
    const equipped = await equipBlock(bot, material)
    if (!equipped) return { ok: false, reason: 'no_material_in_inventory' }
    await ensureInRange(bot, { x, y, z })
    bot.lookAt(new Vec3(x + 0.5, y + 0.5, z + 0.5))
    await new Promise((r) => setTimeout(r, 100))
    const support = findPlaceSupport(bot, x, y, z)
    if (!support) return { ok: false, reason: 'no_support_block' }
    try {
        // @ts-ignore face normal vec3
        await bot.placeBlock(support.ref, support.face)
        await new Promise((r) => setTimeout(r, 150))
        return { ok: true }
    } catch (e) {
        return { ok: false, reason: 'place_failed' }
    }
}
