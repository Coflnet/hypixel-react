import { CSSProperties } from 'react'
import styles from './Startpage.module.css'
import { Card } from 'react-bootstrap'
import Skeleton from 'react-loading-skeleton'

interface Props {
    style: CSSProperties
}

export function StartpageLargeElementSkeleton(props: Props) {
    return (
        <div className={`${styles.cardWrapper}`} style={props.style}>
            <Card>
                <Card.Header style={{ padding: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', height: 32, marginBottom: '1rem' }}>
                        <Skeleton circle height={32} width={32} style={{ marginRight: '5px' }} baseColor="#333" enableAnimation={false} />
                        <Skeleton width={'130px'} baseColor="#333" enableAnimation={false} />
                    </div>
                </Card.Header>
                <Card.Body>
                    <ul>
                        <li>
                            <Skeleton baseColor="#444" enableAnimation={false} />
                            <Skeleton baseColor="#444" enableAnimation={false} width={60} />
                        </li>
                        <li>
                            <Skeleton baseColor="#444" enableAnimation={false} />
                        </li>
                        <li>
                            <Skeleton baseColor="#444" enableAnimation={false} width={40} />
                        </li>
                    </ul>
                </Card.Body>
            </Card>
        </div>
    )
}
