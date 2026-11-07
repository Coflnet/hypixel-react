import type { ReactNode } from 'react'
import type { PublicTask } from '../../api/publicTaskApi'

function ExternalLink({ href, children }: { href?: string; children: ReactNode }) {
    if (!href) {
        return <>{children}</>
    }
    return (
        <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
        </a>
    )
}

/** Island, exact spot, warp command and wiki links. */
export function TaskLocation({ task }: { task: PublicTask }) {
    if (!task.island && !task.where && !task.warp && !task.wikiUrl) {
        return null
    }
    return (
        <section className="mt-4">
            <h2 className="h4">Where to do it</h2>
            <dl className="row mb-0">
                {task.island ? (
                    <>
                        <dt className="col-sm-3">Island</dt>
                        <dd className="col-sm-9">{task.island}</dd>
                    </>
                ) : null}
                {task.where ? (
                    <>
                        <dt className="col-sm-3">Location</dt>
                        <dd className="col-sm-9">
                            <ExternalLink href={task.whereWikiUrl}>{task.where}</ExternalLink>
                        </dd>
                    </>
                ) : null}
                {task.warp ? (
                    <>
                        <dt className="col-sm-3">Warp</dt>
                        <dd className="col-sm-9">
                            <code>/warp {task.warp}</code>
                        </dd>
                    </>
                ) : null}
                {task.wikiUrl ? (
                    <>
                        <dt className="col-sm-3">Wiki</dt>
                        <dd className="col-sm-9">
                            <ExternalLink href={task.wikiUrl}>{task.name} on the Hypixel SkyBlock wiki</ExternalLink>
                        </dd>
                    </>
                ) : null}
            </dl>
        </section>
    )
}
