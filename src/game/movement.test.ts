import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Bot } from 'mineflayer'
import { moveToPosition, ensureInRange } from './movement'

describe('movement', () => {
    describe('moveToPosition', () => {
        let bot: Partial<Bot>

        beforeEach(() => {
            bot = {
                entity: {
                    position: {
                        x: 0,
                        y: 64,
                        z: 0,
                        distanceTo: vi.fn()
                    } as any
                },
                setControlState: vi.fn(),
                movement: {
                    off: vi.fn(),
                    getYaw: vi.fn().mockReturnValue(0),
                    steer: vi.fn().mockResolvedValue(undefined),
                    heuristic: {
                        get: vi.fn().mockReturnValue({
                            target: vi.fn()
                        })
                    }
                } as any
            }
        })

        it('should reach target when within tolerance', async () => {
            // Bot starts at 0,0,0
            // @ts-ignore
            bot.entity.position.x = 0
            bot.entity.position.y = 64
            bot.entity.position.z = 0

            // Target is within tolerance
            bot.entity.position.distanceTo = vi.fn().mockReturnValue(1.5)

            const result = await moveToPosition(bot as Bot, {
                x: 2,
                y: 64,
                z: 2
            })

            expect(result.reached).toBe(true)
        })

        it('should not reach target when outside tolerance', async () => {
            // Bot starts at 0,0,0
            bot.entity.position.x = 0
            bot.entity.position.y = 64
            bot.entity.position.z = 0

            // Target is far away, but loop will eventually exit due to small timeout
            bot.entity.position.distanceTo = vi.fn().mockReturnValue(10)

            const result = await moveToPosition(
                bot as Bot,
                { x: 100, y: 64, z: 100 },
                { timeoutMs: 100 }
            )

            expect(result.reached).toBe(false)
        }, 5000)

        it('should use minimum tolerance of 0.5', async () => {
            bot.entity.position.distanceTo = vi.fn().mockReturnValue(0.3)

            const result = await moveToPosition(
                bot as Bot,
                { x: 0, y: 64, z: 0 },
                { tolerance: -1 }
            )

            // Even with negative tolerance, should use 0.5 minimum
            expect(result.reached).toBe(true)
        })

        it('should timeout after specified duration', async () => {
            // Mock long-running movement
            let callCount = 0
            bot.entity.position.distanceTo = vi.fn(() => {
                callCount++
                return callCount < 5 ? 100 : 1.5 // Stay far until timeout
            })

            const startTime = Date.now()
            await moveToPosition(
                bot as Bot,
                { x: 100, y: 64, z: 100 },
                { timeoutMs: 500 }
            )
            const elapsed = Date.now() - startTime

            // Should timeout around 500ms (accounting for overhead)
            expect(elapsed).toBeGreaterThan(300)
            expect(elapsed).toBeLessThan(1000)
        }, 2000)

        it('should cleanup control states in finally block', async () => {
            bot.entity.position.distanceTo = vi.fn().mockReturnValue(1.5)

            await moveToPosition(bot as Bot, { x: 2, y: 64, z: 2 })

            // Should turn off controls
            expect(bot.setControlState).toHaveBeenCalledWith('forward', false)
            expect(bot.setControlState).toHaveBeenCalledWith('sprint', false)
            expect(bot.setControlState).toHaveBeenCalledWith('jump', false)
        })
    })

    describe('ensureInRange', () => {
        let bot: Partial<Bot>

        beforeEach(() => {
            bot = {
                entity: {
                    position: {
                        x: 0,
                        y: 64,
                        z: 0,
                        distanceTo: vi.fn().mockReturnValue(1.5)
                    } as any
                },
                setControlState: vi.fn(),
                movement: {
                    getYaw: vi.fn().mockReturnValue(0),
                    steer: vi.fn().mockResolvedValue(undefined),
                    heuristic: {
                        get: vi.fn().mockReturnValue({
                            target: vi.fn()
                        })
                    }
                } as any
            }
        })

        it('should delegate to moveToPosition with default maxDistance', async () => {
            await ensureInRange(bot as Bot, { x: 2, y: 64, z: 2 })

            // Should have called movement methods
            expect(bot.setControlState).toHaveBeenCalled()
        })

        it('should use custom maxDistance when provided', async () => {
            bot.entity.position.distanceTo = vi.fn().mockReturnValue(5)

            await ensureInRange(bot as Bot, { x: 100, y: 64, z: 100 }, 8)

            // Should still reach since tolerance is 8
            expect(bot.setControlState).toHaveBeenCalled()
        })
    })
})
