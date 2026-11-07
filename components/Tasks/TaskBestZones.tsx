import { Table } from 'react-bootstrap'
import type { PublicTaskZone } from '../../api/_generated/skyApi.schemas'
import { formatCoins, formatCount } from './taskUtils'

export function TaskBestZones({ zones }: { zones: PublicTaskZone[] }) {
    if (zones.length === 0) {
        return null
    }
    const ordered = [...zones].sort((a, b) => b.coinsPerHour - a.coinsPerHour)
    return (
        <section className="mt-4">
            <h2 className="h4">Best zones</h2>
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Zone</th>
                        <th>Coins/hour</th>
                        <th>Players</th>
                    </tr>
                </thead>
                <tbody>
                    {ordered.map(zone => (
                        <tr key={zone.zone}>
                            <td>{zone.zone}</td>
                            <td>{formatCoins(zone.coinsPerHour)}</td>
                            <td>{formatCount(zone.players)}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </section>
    )
}
