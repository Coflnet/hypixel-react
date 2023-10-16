'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Card } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import { getSetting, HIDE_RELATED_ITEMS, setSetting } from '../../utils/SettingsUtils'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import styles from './RelatedItems.module.css'
import Image from 'next/image'

interface Props {
    tag: string
}

function RelatedItems(props: Props) {
    let [relatedItems, setRelatedItems] = useState<Item[]>([])
    let [hide, setHide] = useState<boolean>(getSetting(HIDE_RELATED_ITEMS, 'false') === 'true')

    useEffect(() => {
        api.getRelatedItems(props.tag).then(items => {
            setRelatedItems(items)
        })
    }, [props.tag])

    function toggleHide() {
        let newHide = !hide
        setHide(newHide)
        setSetting(HIDE_RELATED_ITEMS, newHide.toString())
    }

    if (!relatedItems) {
        return null
    }

    return (
        <>
            {!hide ? (
                <div style={{ paddingBottom: '25px' }}>
                    <h3>
                        Similar items
                        <span className={styles.hideIcon} title="Hide similar items" onClick={toggleHide}>
                            <VisibilityOff />
                        </span>
                    </h3>
                    <div className={styles.cardsWrapper}>
                        {relatedItems.map(item => (
                            <div className={`${styles.cardWrapper} disableLinkStyle`} style={{ padding: '15px 15px 15px 15px' }} key={item.tag}>
                                <Link href={`/item/${item.tag}`} className="disableLinkStyle">
                                    <Card>
                                        <Card.Header style={{ height: '100%', padding: '20px' }}>
                                            <Card.Title className={styles.ellipsis}>
                                                <div className="ellipse">
                                                    <Image
                                                        crossOrigin="anonymous"
                                                        src={item.iconUrl || ''}
                                                        height="32"
                                                        width="32"
                                                        alt=""
                                                        style={{ marginRight: '5px', float: 'left' }}
                                                        loading="lazy"
                                                    />
                                                    <span title={item.name}>{item.name}</span>
                                                </div>
                                            </Card.Title>
                                        </Card.Header>
                                    </Card>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <p style={{ cursor: 'pointer' }} onClick={toggleHide}>
                    Show similar items{' '}
                    <span className={styles.hideIcon} title="Show similar items" onClick={toggleHide}>
                        <Visibility />
                    </span>
                </p>
            )}
        </>
    )
}

export default RelatedItems
