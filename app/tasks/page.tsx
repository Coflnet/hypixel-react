import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from 'react-bootstrap'
import type { PublicTask } from '../../api/publicTaskApi'
import NavBar from '../../components/NavBar/NavBar'
import { JsonLd } from '../../components/Tasks/JsonLd'
import { TaskDataNote } from '../../components/Tasks/TaskDataNote'
import { TaskEmptyState } from '../../components/Tasks/TaskEmptyState'
import { TaskList } from '../../components/Tasks/TaskList'
import { TaskModCta } from '../../components/Tasks/TaskModCta'
import { buildTaskItemList } from '../../components/Tasks/taskStructuredData'
import { getCanonicalUrl, getHeadMetadata } from '../../utils/SSRUtils'
import { loadTasksOrThrow } from './loadTasks'

export const revalidate = 600

const TITLE = 'Hypixel SkyBlock Money Making Methods – Live Coins per Hour'

export async function generateMetadata(): Promise<Metadata> {
    const tasks = await loadTasksOrThrow()
    const metadata = getHeadMetadata(
        TITLE,
        'Live coins per hour for Hypixel SkyBlock money making methods, measured from community-tracked activity of SkyCofl mod users. See how many players do each task right now.',
        undefined,
        ['money making methods', 'coins per hour', 'skyblock money making', 'best money making', 'skycofl tasks'],
        TITLE,
        getCanonicalUrl('/tasks')
    )
    if (tasks && tasks.length > 0) {
        return metadata
    }
    // the empty state (e.g. prerendered while the API is down) must not be indexed
    return { ...metadata, robots: { index: false, follow: true } }
}

export default async function Page() {
    const tasks = await loadTasksOrThrow()
    return (
        <Container>
            <NavBar />
            <h1>{TITLE}</h1>
            <hr />
            <p className="lead">
                Which money making method earns the most coins right now? This list ranks Hypixel SkyBlock tasks by their live coins/hour estimate, based on
                what SkyCofl mod users actually collect. Looking for an overview of every method? Read the{' '}
                <Link href="/guides/money-making-methods">money making methods guide</Link>.
            </p>
            <TaskContent tasks={tasks} />
            <TaskModCta />
            <TaskDataNote />
        </Container>
    )
}

function TaskContent({ tasks }: { tasks: PublicTask[] | null }) {
    if (!tasks || tasks.length === 0) {
        return <TaskEmptyState />
    }
    return (
        <>
            <TaskList tasks={tasks} />
            <JsonLd data={buildTaskItemList(tasks)} />
        </>
    )
}
