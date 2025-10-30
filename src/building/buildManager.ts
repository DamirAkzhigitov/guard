import { BuildProject } from '../types'
import { generateStructureBlocks } from './structures'

const buildProjects: BuildProject[] = []

export function getActiveBuild(): BuildProject | undefined {
    return buildProjects.find((b) => b.status === 'active')
}

export function getBuildStateSnapshot() {
    const active = getActiveBuild()
    if (!active) return null
    return {
        id: active.id,
        name: active.name,
        type: active.structureType,
        origin: active.origin,
        material: active.material,
        total: active.blocks.length,
        done: active.placedIndices.size
    }
}

export function createBuildProject(
    structureType: string,
    material: string,
    origin: { x: number; y: number; z: number },
    size: any,
    name?: string
): BuildProject {
    const blocks = generateStructureBlocks(
        structureType,
        material,
        origin,
        size
    )
    const proj: BuildProject = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: name || `${structureType}`,
        structureType,
        origin,
        material,
        blocks,
        placedIndices: new Set<number>(),
        status: 'pending',
        createdAt: Date.now()
    }
    buildProjects.push(proj)
    return proj
}

export function completeBuildProject(proj: BuildProject) {
    proj.status = 'completed'
    proj.completedAt = Date.now()
}

export function getNextUnplacedIndices(
    proj: BuildProject,
    limit: number
): number[] {
    const out: number[] = []
    for (let i = 0; i < proj.blocks.length; i++) {
        if (!proj.placedIndices.has(i)) {
            out.push(i)
            if (out.length >= limit) break
        }
    }
    return out
}
