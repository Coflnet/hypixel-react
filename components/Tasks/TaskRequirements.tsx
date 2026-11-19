import type { PublicTaskLabeledRequirement } from '../../api/publicTaskApi'

function RequirementList({ title, requirements }: { title: string; requirements: PublicTaskLabeledRequirement[] }) {
    if (requirements.length === 0) {
        return null
    }
    return (
        <>
            <dt className="col-sm-3">{title}</dt>
            <dd className="col-sm-9">
                <ul className="list-unstyled mb-0">
                    {requirements.map(requirement => (
                        <li key={`${requirement.kind}-${requirement.key ?? ''}-${requirement.label}`}>{requirement.label}</li>
                    ))}
                </ul>
            </dd>
        </>
    )
}

/** What a player needs for the task (hard requirements) and what is only recommended. */
export function TaskRequirements({ requirements }: { requirements: PublicTaskLabeledRequirement[] }) {
    if (requirements.length === 0) {
        return null
    }
    return (
        <section className="mt-4" data-cy="task-requirements">
            <h2 className="h4">Requirements</h2>
            <dl className="row mb-0">
                <RequirementList title="Needed" requirements={requirements.filter(r => r.hard)} />
                <RequirementList title="Recommended" requirements={requirements.filter(r => !r.hard)} />
            </dl>
        </section>
    )
}
