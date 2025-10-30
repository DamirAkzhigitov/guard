import type { Bot } from 'mineflayer'

export async function equipBlock(bot: Bot, material: string): Promise<boolean> {
    const item = bot.inventory
        .items()
        .find((i) => i.name.toLowerCase().includes(material.toLowerCase()))
    if (!item) return false
    try {
        await bot.equip(item, 'hand')
        return true
    } catch {
        return false
    }
}

