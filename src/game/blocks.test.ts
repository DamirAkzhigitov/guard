import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Bot } from 'mineflayer'
import { isAirLike, findPlaceSupport, placeBlockAt } from './blocks'

describe('blocks', () => {
    describe('isAirLike', () => {
        it('should return true for null or undefined', () => {
            expect(isAirLike(null)).toBe(true)
            expect(isAirLike(undefined)).toBe(true)
        })

        it('should return true for air blocks', () => {
            expect(isAirLike({ name: 'air' })).toBe(true)
            expect(isAirLike({ name: 'cave_air' })).toBe(true)
            expect(isAirLike({ name: 'void_air' })).toBe(true)
        })

        it('should return false for solid blocks', () => {
            expect(isAirLike({ name: 'grass_block' })).toBe(false)
            expect(isAirLike({ name: 'stone' })).toBe(false)
            expect(isAirLike({ name: 'dirt' })).toBe(false)
        })
    })

    describe('findPlaceSupport', () => {
        let bot: Partial<Bot>

        beforeEach(() => {
            bot = {
                blockAt: vi.fn()
            }
        })

        it('should find support block below', () => {
            const mockBlock = { name: 'grass_block' }
            // @ts-ignore
            vi.mocked(bot.blockAt).mockImplementation((vec: any) => {
                if (vec.y === 4) return mockBlock // below
                return null
            })

            const result = findPlaceSupport(bot as Bot, 10, 5, 10)
            expect(result).not.toBeNull()
            expect(result?.ref).toBe(mockBlock)
            expect(result?.face.x).toBe(0)
            expect(result?.face.y).toBe(1)
            expect(result?.face.z).toBe(0)
        })

        it('should find support block from left side', () => {
            const mockBlock = { name: 'stone' }
            // @ts-ignore
            vi.mocked(bot.blockAt).mockImplementation((vec: any) => {
                if (vec.x === 9) return mockBlock // left
                return null
            })

            const result = findPlaceSupport(bot as Bot, 10, 5, 10)
            expect(result).not.toBeNull()
            expect(result?.ref).toBe(mockBlock)
            expect(result?.face.x).toBe(1)
            expect(result?.face.y).toBe(0)
            expect(result?.face.z).toBe(0)
        })

        it('should return null when no support found', () => {
            // @ts-ignore
            vi.mocked(bot.blockAt).mockReturnValue(null)

            const result = findPlaceSupport(bot as Bot, 10, 5, 10)
            expect(result).toBeNull()
        })

        it('should not consider air blocks as support', () => {
            // @ts-ignore
            vi.mocked(bot.blockAt).mockReturnValue({ name: 'air' })

            const result = findPlaceSupport(bot as Bot, 10, 5, 10)
            expect(result).toBeNull()
        })
    })

    describe('placeBlockAt', () => {
        let bot: Partial<Bot>

        beforeEach(() => {
            bot = {
                blockAt: vi.fn(),
                equip: vi.fn().mockResolvedValue(undefined),
                inventory: {
                    items: vi
                        .fn()
                        .mockReturnValue([
                            { name: 'cobblestone', type: 4, count: 64 }
                        ])
                } as any,
                entity: {
                    position: {
                        distanceTo: vi.fn().mockReturnValue(1.5)
                    } as any
                },
                lookAt: vi.fn().mockResolvedValue(undefined),
                placeBlock: vi.fn().mockResolvedValue(undefined),
                setControlState: vi.fn(),
                movement: {
                    heuristic: {
                        get: vi.fn().mockReturnValue({
                            target: vi.fn()
                        })
                    },
                    getYaw: vi.fn().mockReturnValue(0),
                    steer: vi.fn().mockResolvedValue(undefined)
                } as any
            } as any
        })

        it('should return success if block already exists', async () => {
            const mockBlock = { name: 'cobblestone' }
            // @ts-ignore
            vi.mocked(bot.blockAt).mockReturnValue(mockBlock)

            const result = await placeBlockAt(
                bot as Bot,
                'cobblestone',
                10,
                5,
                10
            )
            expect(result.ok).toBe(true)
            // Should not try to place
            expect(bot.placeBlock).not.toHaveBeenCalled()
        })

        it('should return failure when no material in inventory', async () => {
            // @ts-ignore
            vi.mocked(bot.blockAt).mockReturnValue({ name: 'air' })
            // @ts-ignore
            bot.inventory = { items: vi.fn().mockReturnValue([]) } as any

            const result = await placeBlockAt(
                bot as Bot,
                'diamond_block',
                10,
                5,
                10
            )
            expect(result.ok).toBe(false)
            expect(result.reason).toBe('no_material_in_inventory')
        })

        it('should return failure when no support block available', async () => {
            // @ts-ignore
            vi.mocked(bot.blockAt).mockImplementation((vec: any) => {
                if (vec.x === 10 && vec.y === 5 && vec.z === 10)
                    return { name: 'air' }
                return { name: 'air' } // All surrounding blocks are air
            })

            const result = await placeBlockAt(
                bot as Bot,
                'cobblestone',
                10,
                5,
                10
            )
            expect(result.ok).toBe(false)
            expect(result.reason).toBe('no_support_block')
        })

        it('should successfully place block when all conditions met', async () => {
            // @ts-ignore
            vi.mocked(bot.blockAt).mockImplementation((vec: any) => {
                if (vec.x === 10 && vec.y === 5 && vec.z === 10)
                    return { name: 'air' }
                if (vec.y === 4) return { name: 'grass_block' } // Support below
                return { name: 'air' }
            })

            const result = await placeBlockAt(
                bot as Bot,
                'cobblestone',
                10,
                5,
                10
            )
            expect(result.ok).toBe(true)
            expect(bot.equip).toHaveBeenCalled()
            expect(bot.placeBlock).toHaveBeenCalled()
        })
    })
})
