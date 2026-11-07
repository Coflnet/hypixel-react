import Link from 'next/link'
import { Card, CardBody, CardText, CardTitle } from 'react-bootstrap'

/** Call to action: personal numbers need the mod and `/cofl task`. */
export function TaskModCta() {
    return (
        <Card className="my-4">
            <CardBody>
                <CardTitle as="h2" className="h5">
                    Get coins/hour for your own profile
                </CardTitle>
                <CardText>
                    These are community averages. Install the <Link href="/mod">SkyCofl mod</Link> and run <code>/cofl task</code> in-game to get estimates
                    based on your own stats, gear and recent drops. The numbers update in real time while you play.
                </CardText>
                <Link href="/mod" className="btn btn-primary">
                    Install the mod
                </Link>{' '}
                <Link href="/wiki/mod-commands#taskcommand" className="btn btn-secondary">
                    /cofl task docs
                </Link>
            </CardBody>
        </Card>
    )
}
