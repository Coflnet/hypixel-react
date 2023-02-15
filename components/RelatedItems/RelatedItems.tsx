import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Card } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import styles from './RelatedItems.module.css'

interface Props {
    tag: string
}

function RelatedItems(props: Props) {
    let [relatedItems, setRelatedItems] = useState<Item[]>([])

    useEffect(() => {
        api.getRelatedItems(props.tag).then(items => {
            setRelatedItems(items)
        })
    }, [props.tag])

    return (
        <>
            <h2>Similar items</h2>
            <div>
                {relatedItems.map(item => (
                    <div className={`${styles.cardWrapper} disableLinkStyle`} key={item.tag}>
                        <Link href={`/item/${item.tag}`}>
                            <a className="disableLinkStyle">
                                <Card>
                                    <Card.Header style={{ height: '100%', padding: '20px' }}>
                                        <div style={{ float: 'left' }}>
                                            <img crossOrigin="anonymous" src={item.iconUrl} height="32" alt="" style={{ marginRight: '5px' }} loading="lazy" />
                                        </div>
                                        <Card.Title className={styles.ellipsis}>{item.name}</Card.Title>
                                    </Card.Header>
                                </Card>
                            </a>
                        </Link>
                    </div>
                ))}
            </div>
        </>
    )
}

export default RelatedItems
