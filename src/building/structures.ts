import { PlannedBlock } from '../types'

export function generateStructureBlocks(
    structureType: string,
    material: string,
    origin: { x: number; y: number; z: number },
    size: { width?: number; depth?: number; height?: number }
): PlannedBlock[] {
    const ox = origin.x
    const oy = origin.y
    const oz = origin.z
    const width = Math.max(1, Math.floor(size?.width ?? 3))
    const depth = Math.max(1, Math.floor(size?.depth ?? 3))
    const height = Math.max(1, Math.floor(size?.height ?? 3))

    const blocks: PlannedBlock[] = []
    if (structureType === 'floor') {
        for (let dx = 0; dx < width; dx++) {
            for (let dz = 0; dz < depth; dz++) {
                blocks.push({ x: ox + dx, y: oy, z: oz + dz, type: material })
            }
        }
    } else if (structureType === 'wall') {
        for (let dx = 0; dx < width; dx++) {
            for (let dy = 0; dy < height; dy++) {
                blocks.push({ x: ox + dx, y: oy + dy, z: oz, type: material })
            }
        }
    } else if (structureType === 'tower') {
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                for (let dz = 0; dz < depth; dz++) {
                    const isEdge =
                        dx === 0 ||
                        dz === 0 ||
                        dx === width - 1 ||
                        dz === depth - 1
                    if (isEdge) {
                        blocks.push({
                            x: ox + dx,
                            y: oy + dy,
                            z: oz + dz,
                            type: material
                        })
                    }
                }
            }
        }
    } else if (structureType === 'house_simple') {
        for (let dx = 0; dx < width; dx++) {
            for (let dz = 0; dz < depth; dz++) {
                blocks.push({ x: ox + dx, y: oy, z: oz + dz, type: material })
            }
        }
        for (let dy = 1; dy <= height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                for (let dz = 0; dz < depth; dz++) {
                    const isEdge =
                        dx === 0 ||
                        dz === 0 ||
                        dx === width - 1 ||
                        dz === depth - 1
                    if (!isEdge) continue
                    const doorX = Math.floor(width / 2)
                    const doorZ = 0
                    const doorLevel = dy <= 2 && dx === doorX && dz === doorZ
                    if (doorLevel) continue
                    blocks.push({
                        x: ox + dx,
                        y: oy + dy,
                        z: oz + dz,
                        type: material
                    })
                }
            }
        }
        for (let dx = 0; dx < width; dx++) {
            for (let dz = 0; dz < depth; dz++) {
                blocks.push({
                    x: ox + dx,
                    y: oy + height + 1,
                    z: oz + dz,
                    type: material
                })
            }
        }
    } else {
        for (let dx = 0; dx < width; dx++) {
            for (let dz = 0; dz < depth; dz++) {
                blocks.push({ x: ox + dx, y: oy, z: oz + dz, type: material })
            }
        }
    }
    return blocks
}
