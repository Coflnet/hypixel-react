import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Container } from 'react-bootstrap'
import type { PublicTask } from '../../../api/publicTaskApi'
import NavBar from '../../../components/NavBar/NavBar'
import { JsonLd } from '../../../components/Tasks/JsonLd'
import { RelatedTasks } from '../../../components/Tasks/RelatedTasks'
import { TaskBestZones } from '../../../components/Tasks/TaskBestZones'
import { TaskDropsTable } from '../../../components/Tasks/TaskDropsTable'
import { TaskLocation } from '../../../components/Tasks/TaskLocation'
import { TaskModCta } from '../../../components/Tasks/TaskModCta'
import { TaskStats } from '../../../components/Tasks/TaskStats'
import { TaskSteps } from '../../../components/Tasks/TaskSteps'
import { TaskTypeBadge } from '../../../components/Tasks/TaskTypeBadge'
import { buildTaskHowTo } from '../../../components/Tasks/taskStructuredData'
import { formatCoins, getTaskPath } from '../../../components/Tasks/taskUtils'
import { getCanonicalUrl, getHeadMetadata } from '../../../utils/SSRUtils'
import { loadTaskOrThrow, loadTasks } from '../loadTasks'

export const revalidate = 600
export const dynamicParams = true

interface Props {
    params: Promise<{ slug: string }>
}

/** No build-time fetch: every slug is rendered on first request and then cached (on-demand ISR). */
export function generateStaticParams() {
    return []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const task = await loadTaskOrThrow(slug)
    if (!task) {
        notFound()
    }
    const coins = formatCoins(task.coinsPerHour)
    const title = `${task.name} – ${coins} Coins/Hour | Hypixel SkyBlock ${task.category} Money Making`
    const description = `${task.name} makes about ${coins} coins per hour in Hypixel SkyBlock (${task.category}). Live estimate from community-tracked SkyCofl mod data, with steps, drops and best zones.`
    return getHeadMetadata(
        title,
        description,
        undefined,
        [task.name, task.category, 'money making', 'coins per hour'],
        title,
        getCanonicalUrl(getTaskPath(task.slug))
    )
}

export default async function Page({ params }: Props) {
    const { slug } = await params
    const task = await loadTaskOrThrow(slug)
    if (!task) {
        notFound()
    }
    return (
        <Container>
            <NavBar />
            <TaskDetails task={task} />
            <TaskModCta />
        </Container>
    )
}

async function TaskDetails({ task }: { task: PublicTask }) {
    const allTasks = await loadTasks()
    return (
        <>
            <p className="mb-1">
                <Link href="/tasks">Money making tasks</Link> / {task.category}
            </p>
            <h1>
                {task.name} – {formatCoins(task.coinsPerHour)} Coins/Hour
                <TaskTypeBadge type={task.type} />
            </h1>
            <hr />
            {task.description ? <p className="lead">{task.description}</p> : null}
            <TaskStats task={task} />
            <TaskSteps steps={task.steps} />
            <TaskLocation task={task} />
            <TaskDropsTable drops={task.drops} />
            <TaskBestZones zones={task.bestZones} />
            <RelatedTasks task={task} allTasks={allTasks} />
            <JsonLd data={buildTaskHowTo(task)} />
        </>
    )
}
