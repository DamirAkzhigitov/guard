import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Bot } from 'mineflayer'
import { equipBlock } from './inventory'

describe('inventory', () => {
    describe('equipBlock', () => {
        let bot: Partial<Bot>

        beforeEach(() => {
            bot = {
                inventory: {
                    items: vi.fn()
                } as any,
                equip: vi.fn()
            } as any
        })

        it('should equip block when exact match found', async () => {
            const mockItem = { name: 'cobblestone', type: 4, count: 64 }
            // @ts-ignore
            vi.mocked(bot.inventory.items).mockReturnValue([mockItem])
            // @ts-ignore
            vi.mocked(bot.equip).mockResolvedValue(undefined)

            const result = await equipBlock(bot as Bot, 'cobblestone')
            expect(result).toBe(true)
            expect(bot.equip).toHaveBeenCalledWith(mockItem, 'hand')
        })

        it('should equip block with case-insensitive matching', async () => {
            const mockItem = { name: 'COBBLESTONE', type: 4, count: 64 }
            // @ts-ignore
            vi.mocked(bot.inventory.items).mockReturnValue([mockItem])
            // @ts-ignore
            vi.mocked(bot.equip).mockResolvedValue(undefined)

            const result = await equipBlock(bot as Bot, 'cobblestone')
            expect(result).toBe(true)
        })

        it('should match block when material name is substring', async () => {
            const mockItem = { name: 'cobblestone', type: 4, count: 64 }
            // @ts-ignore
            vi.mocked(bot.inventory.items).mockReturnValue([mockItem])
            // @ts-ignore
            vi.mocked(bot.equip).mockResolvedValue(undefined)

            const result = await equipBlock(bot as Bot, 'cobble')
            expect(result).toBe(true)
        })

        it('should return false when block not found in inventory', async () => {
            // @ts-ignore
            vi.mocked(bot.inventory.items).mockReturnValue([
                { name: 'dirt', type: 3, count: 64 },
                { name: 'stone', type: 1, count: 64 }
            ])

            const result = await equipBlock(bot as Bot, 'cobblestone')
            expect(result).toBe(false)
            expect(bot.equip).not.toHaveBeenCalled()
        })

        it('should return false when inventory is empty', async () => {
            // @ts-ignore
            vi.mocked(bot.inventory.items).mockReturnValue([])

            const result = await equipBlock(bot as Bot, 'cobblestone')
            expect(result).toBe(false)
        })

        it('should handle equip errors gracefully', async () => {
            const mockItem = { name: 'cobblestone', type: 4, count: 64 }
            // @ts-ignore
            vi.mocked(bot.inventory.items).mockReturnValue([mockItem])
            // @ts-ignore
            vi.mocked(bot.equip).mockRejectedValue(new Error('Cannot equip'))

            const result = await equipBlock(bot as Bot, 'cobblestone')
            expect(result).toBe(false)
        })
    })
})
