'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Badge, Card, Col, Row } from 'react-bootstrap'
import { normalizeSetups, type PublicGearTaggedItem, type PublicTaskGearSetup } from '../../api/publicTaskApi'
import { useGetApiTasksSlugSetups } from '../../api/_generated/skyApi'
import { useGoogleToken } from '../../hooks/useGoogleToken'
import { useTaskSetupDetails } from '../../hooks/useTaskSetupDetails'
import { convertTagToName } from '../../utils/Formatter'
import type { PublicTask } from '../../api/publicTaskApi'
import { getStatusBg, getStatusLabel, toAcquisitionItem, toBasisInfo } from './taskSetupUtils'
import { BasisBadge, ConfidenceBadge } from './TaskSetupBasis'
import { ItemAcquisition } from './TaskItemAcquisition'
import { TaskSetupsPremium } from './TaskSetupsPremium'
import { getItemIconUrl, getTaskPath } from './taskUtils'

function SetupItem({ item }: { item: PublicGearTaggedItem }) {
    const name = item.itemName || convertTagToName(item.itemTag)
    return (
        <li className="mb-2">
            <Link href={`/item/${item.itemTag}`} className="d-inline-flex align-items-center gap-2 text-break">
                <Image crossOrigin="anonymous" src={getItemIconUrl(item.itemTag)} height={24} width={24} alt="" loading="lazy" />
                {name}
            </Link>
            {item.slot ? <Badge bg="light" text="dark" className="ms-2 border">{item.slot}</Badge> : null}
            {item.reason ? <div className="small text-muted">{item.reason}</div> : null}
            <ItemAcquisition item={toAcquisitionItem(item)} name={name} />
        </li>
    )
}

function SetupDetails({ setup }: { setup: PublicTaskGearSetup }) {
    if (setup.assumptions.length === 0 && setup.sources.length === 0) {
        return null
    }
    return (
        <details className="small mt-2">
            <summary>Assumptions and sources</summary>
            {setup.assumptions.length > 0 ? (
                <ul className="mt-2 mb-1">
                    {setup.assumptions.map((assumption, i) => (
                        <li key={i}>{assumption}</li>
                    ))}
                </ul>
            ) : null}
            {setup.sources.length > 0 ? (
                <ul className="mb-0">
                    {setup.sources.map(source => (
                        <li key={source}>
                            <a href={source} target="_blank" rel="noopener noreferrer nofollow" className="text-break">
                                {source}
                            </a>
                        </li>
                    ))}
                </ul>
            ) : null}
        </details>
    )
}

function UnlocksTask({ task }: { task?: PublicTask }) {
    if (!task) {
        return null
    }
    return (
        <p className="small mb-2">
            Unlocks <Link href={getTaskPath(task.slug)}>{task.name}</Link>
        </p>
    )
}

function SetupCard({ setup, label, startingGear, unlocks }: { setup: PublicTaskGearSetup; label: string; startingGear: boolean; unlocks?: PublicTask }) {
    return (
        <Card className="h-100">
            <div className="card-body">
                <h3 className="h5 card-title">{label}</h3>
                <p className="small text-muted">{setup.name}</p>
                <div className="mb-2 d-flex flex-wrap gap-1">
                    <Badge bg={getStatusBg(setup.status)}>{startingGear ? 'Starting gear' : getStatusLabel(setup.status)}</Badge>
                    <BasisBadge basis={toBasisInfo(setup)} />
                    <ConfidenceBadge confidence={setup.confidence} />
                </div>
                <UnlocksTask task={unlocks} />
                <ul className="list-unstyled mb-0">
                    {setup.items.map((item, i) => (
                        <SetupItem key={`${item.itemTag}-${i}`} item={item} />
                    ))}
                </ul>
                <SetupDetails setup={setup} />
            </div>
        </Card>
    )
}

export function TaskSetups({ slug, allTasks }: { slug: string; allTasks: PublicTask[] | null }) {
    const token = useGoogleToken()
    const query = useGetApiTasksSlugSetups(encodeURIComponent(slug), {
        query: { enabled: !!token, staleTime: 2 * 60 * 1000, retry: false }
    })
    const setups = token && query.data?.status === 200 ? normalizeSetups(query.data.data, { details: false }) : null
    const details = useTaskSetupDetails(slug, !!setups?.locked)
    if (!setups) {
        return null
    }
    const visible = details.data ?? setups
    const progression = visible.setups.filter(setup => setup.items.length > 0)
    const cards = visible.baseline?.items.length && !progression.some(setup => setup.tier === 'budget') ? [visible.baseline, ...progression] : progression
    const labels = cards.length === 1 ? ['Recommended'] : cards.length === 2 ? ['Early', 'Late'] : ['Early', 'Mid', 'Late']
    return (
        <section className="mt-4" id="gear-setups">
            <h2 className="h4">Gear setups{setups.profileName ? ` for ${setups.profileName}` : ''}</h2>
            <p className="text-muted">
                Compare gear at different price points, including costs and payback.
            </p>
            {cards.length > 0 ? <Row xs={1} md={cards.length === 1 ? 1 : 2} xl={3} className="g-3">
                {cards.map((setup, index) => (
                    <Col key={setup.id}>
                        <SetupCard setup={setup} label={labels[index]} startingGear={setup.status === 'reached' && !!setup.unlocksTask && setup.unlocksTask !== slug} unlocks={allTasks?.find(t => t.slug === setup.unlocksTask)} />
                    </Col>
                ))}
            </Row> : null}
            <TaskSetupsPremium setups={setups} details={details} />
        </section>
    )
}
