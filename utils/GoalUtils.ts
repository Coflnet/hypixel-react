import type { ModGoalStep } from '../api/_generated/skyApi.schemas'

export type GoalStepStatusVariant = 'secondary' | 'primary' | 'warning' | 'orange' | 'success'

const STATUS_VARIANTS: Record<string, GoalStepStatusVariant> = {
    todo: 'secondary',
    ordered: 'primary',
    ready: 'warning',
    forging: 'orange',
    done: 'success'
}

const KIND_LABELS: Record<string, string> = {
    buyOrder: 'Buy order',
    instaBuy: 'Instant buy',
    npc: 'NPC',
    auction: 'Auction',
    craft: 'Craft',
    forge: 'Forge',
    sell: 'Sell'
}

/** Badge variant for a step status; 'orange' is not a bootstrap variant and is styled in GoalList.module.css. */
export function getStepStatusVariant(status: string): GoalStepStatusVariant {
    return STATUS_VARIANTS[status] ?? 'secondary'
}

export function getStepKindLabel(kind: string): string {
    return KIND_LABELS[kind] ?? kind
}

/** Pre-order list of the steps the player can do right now: todo/ready steps whose children are all done. */
export function flattenActionableSteps(root: ModGoalStep | null | undefined): ModGoalStep[] {
    if (!root) {
        return []
    }
    const result: ModGoalStep[] = []
    const visit = (step: ModGoalStep) => {
        const children = step.children ?? []
        if ((step.status === 'todo' || step.status === 'ready') && children.every(child => child.status === 'done')) {
            result.push(step)
        }
        children.forEach(visit)
    }
    visit(root)
    return result
}
