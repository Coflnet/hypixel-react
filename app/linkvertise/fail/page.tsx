import { Container } from 'react-bootstrap'
import NavBar from '../../../components/NavBar/NavBar'
import Link from 'next/link'
import { getHeadMetadata, getCanonicalUrl } from '../../../utils/SSRUtils'

const failureMessages: Record<string, string> = {
    'invalid-callback': 'The return link was invalid. Please start a new task using one of the links on this website.',
    unconfirmed: 'The provider has not confirmed completion yet. Wait a moment and check your premium status before starting another task.',
    expired: 'This task was already used or its session expired. Please start a new task.'
}

export default async function Page({ searchParams }: { searchParams: Promise<{ reason?: string | string[] }> }) {
    const params = await searchParams
    const reason = Array.isArray(params.reason) ? params.reason[0] : params.reason
    const message = (reason && failureMessages[reason]) || 'We could not verify that the task was completed.'

    return (
        <>
            <Container>
                <h2>
                    <NavBar />
                    Ad task failed
                </h2>
                <hr />
                <p>{message}</p>
                <p>
                    You can try again <Link href="/linkvertise">here</Link>.
                </p>
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata(
    'Ad reward',
    'Ad task failed',
    undefined,
    undefined,
    undefined,
    getCanonicalUrl('/linkvertise/fail')
)
