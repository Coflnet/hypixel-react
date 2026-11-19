import type { PublicTaskStep } from '../../api/_generated/skyApi.schemas'

export function TaskSteps({ steps }: { steps: PublicTaskStep[] }) {
    if (steps.length === 0) {
        return null
    }
    const ordered = [...steps].sort((a, b) => a.number - b.number)
    return (
        <section className="mt-4">
            <h2 className="h4">How to do it</h2>
            <ol>
                {ordered.map(step => (
                    <li key={step.number}>{step.text}</li>
                ))}
            </ol>
        </section>
    )
}
