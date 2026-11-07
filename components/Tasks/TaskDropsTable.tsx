import Image from 'next/image'
import Link from 'next/link'
import { Table } from 'react-bootstrap'
import type { PublicTaskItemDrop } from '../../api/publicTaskApi'
import { convertTagToName } from '../../utils/Formatter'
import { formatCoins, formatRate, getItemIconUrl } from './taskUtils'

function DropRow({ drop }: { drop: PublicTaskItemDrop }) {
    const name = drop.itemName || convertTagToName(drop.itemTag)
    return (
        <tr>
            <td>
                <Link href={`/item/${drop.itemTag}`} className="d-inline-flex align-items-center gap-2">
                    <Image crossOrigin="anonymous" src={getItemIconUrl(drop.itemTag)} height={24} width={24} alt="" loading="lazy" />
                    {name}
                </Link>
            </td>
            <td>{formatRate(drop.ratePerHour)}</td>
            <td>{formatCoins(drop.priceEach)}</td>
            <td>{formatCoins(drop.contributionPerHour)}</td>
        </tr>
    )
}

export function TaskDropsTable({ drops }: { drops: PublicTaskItemDrop[] }) {
    if (drops.length === 0) {
        return null
    }
    const ordered = [...drops].sort((a, b) => b.contributionPerHour - a.contributionPerHour)
    return (
        <section className="mt-4">
            <h2 className="h4">Drops and their value</h2>
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Per hour</th>
                        <th>Price each</th>
                        <th>Coins/hour</th>
                    </tr>
                </thead>
                <tbody>
                    {ordered.map((drop, i) => (
                        <DropRow key={`${drop.itemTag}-${i}`} drop={drop} />
                    ))}
                </tbody>
            </Table>
        </section>
    )
}
