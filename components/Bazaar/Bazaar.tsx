'use client'
import { Card } from 'react-bootstrap'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import Image from 'next/image'
import api from '../../api/ApiHelper'
import styles from './Bazaar.module.css'
import { Number } from '../Number/Number'

interface Props {
    flips: BazaarSpreadFlip[]
}

function Bazaar(props: Props) {
    const { flips } = props

    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const flip: BazaarSpreadFlip = flips[index]

        return (
            <div style={{ ...style, height: 350, paddingRight: 15 }}>
                <Card>
                    <Card.Header style={{ padding: '10px', display: 'flex', justifyContent: 'space-between' }}>
                        <div className="ellipse" style={{ fontSize: 'larger' }}>
                            <Image
                                crossOrigin="anonymous"
                                src={api.getItemImageUrl({ tag: flip.flip.itemTag })}
                                height="32"
                                width="32"
                                alt=""
                                style={{ marginRight: '5px' }}
                                loading="lazy"
                            />
                            {flip.itemName}
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <Card.Text>
                            <p>
                                <span className={styles.label}>Buy Price:</span> <Number number={flip.flip.buyPrice} />
                            </p>
                            <p>
                                <span className={styles.label}>Sell Price:</span> <Number number={flip.flip.sellPrice} />
                            </p>
                            <p>
                                <span className={styles.label}>Profit Per Hour:</span> <Number number={flip.flip.profitPerHour} />
                            </p>
                            <p>
                                <span className={styles.label}>Volume:</span> <Number number={flip.flip.volume} />
                            </p>
                            <p>
                                <span className={styles.label}>Timestamp:</span> {flip.flip.timestamp}
                            </p>
                            <p>
                                <span className={styles.label}>Is Manipulated:</span> {flip.isManipulated ? 'Yes' : 'No'}
                            </p>
                        </Card.Text>
                    </Card.Body>
                </Card>
            </div>
        )
    }

    return (
        <>
            <div style={{ height: '80vh' }}>
                <AutoSizer>
                    {({ height, width }) => (
                        <FixedSizeList height={height} width={width} itemData={flips} itemCount={flips.length} itemSize={350}>
                            {Row}
                        </FixedSizeList>
                    )}
                </AutoSizer>
            </div>
        </>
    )
}

export default Bazaar
