import { flattenActionableSteps, getStepKindLabel, getStepStatusVariant } from '../../utils/GoalUtils'
import type { ModGoalStep } from '../../api/_generated/skyApi.schemas'

function step(id: string, status: ModGoalStep['status'], children: ModGoalStep[] = [], kind: ModGoalStep['kind'] = 'craft'): ModGoalStep {
    return { id, kind, itemTag: id.toUpperCase(), itemName: id, quantity: 1, status, children }
}

describe('Goal utilities', () => {
    it('maps statuses to badge variants', () => {
        expect(getStepStatusVariant('todo')).to.equal('secondary')
        expect(getStepStatusVariant('ordered')).to.equal('primary')
        expect(getStepStatusVariant('ready')).to.equal('warning')
        expect(getStepStatusVariant('forging')).to.equal('orange')
        expect(getStepStatusVariant('done')).to.equal('success')
        expect(getStepStatusVariant('unknown')).to.equal('secondary')
    })

    it('labels step kinds', () => {
        expect(getStepKindLabel('buyOrder')).to.equal('Buy order')
        expect(getStepKindLabel('instaBuy')).to.equal('Instant buy')
        expect(getStepKindLabel('npc')).to.equal('NPC')
        expect(getStepKindLabel('auction')).to.equal('Auction')
        expect(getStepKindLabel('craft')).to.equal('Craft')
        expect(getStepKindLabel('forge')).to.equal('Forge')
        expect(getStepKindLabel('sell')).to.equal('Sell')
        expect(getStepKindLabel('other')).to.equal('other')
    })

    it('lists todo/ready steps whose children are done in pre-order', () => {
        const root = step('root', 'todo', [
            step('a', 'todo', [step('a1', 'done', [], 'buyOrder')]),
            step('b', 'ready'),
            step('c', 'todo', [step('c1', 'todo', [], 'buyOrder')]),
            step('d', 'ordered'),
            step('e', 'done')
        ])
        expect(flattenActionableSteps(root).map(s => s.id)).to.deep.equal(['a', 'b', 'c1'])
    })

    it('returns the root when it has no children and handles missing roots', () => {
        expect(flattenActionableSteps(step('x', 'ready')).map(s => s.id)).to.deep.equal(['x'])
        expect(flattenActionableSteps(undefined)).to.deep.equal([])
        expect(flattenActionableSteps(step('x', 'done'))).to.deep.equal([])
    })
})
