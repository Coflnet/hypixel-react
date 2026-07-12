'use client'
import { useEffect, useState } from 'react'
import DeleteIcon from '@mui/icons-material/Delete'
import { Button, Card, Container, Form, InputGroup } from 'react-bootstrap'
import { toast } from 'react-toastify'
import type { LowballOfferResponse } from '../../api/_generated/skyApi'
import { SkyApiClientError, deleteLowballOffer, getItemLowballOffers, getOwnLowballOffers } from '../../api/skyApiClient'
import { convertTagToName, removeMinecraftColorCoding } from '../../utils/Formatter'
import { getLoadingElement } from '../../utils/LoadingUtils'
import Number from '../Number/Number'

interface Props {
    canLoadOwnOffers?: boolean
    showOwnOffersByDefault?: boolean
}

export default function LowballOfferList(props: Props) {
    const [offers, setOffers] = useState<LowballOfferResponse[]>([])
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [itemTag, setItemTag] = useState('')
    const [viewMode, setViewMode] = useState<'own' | 'item'>(props.showOwnOffersByDefault ? 'own' : 'item')

    useEffect(() => {
        if (props.showOwnOffersByDefault && props.canLoadOwnOffers) {
            void loadOwnOffers()
        }
    }, [props.canLoadOwnOffers, props.showOwnOffersByDefault])

    function normalizeError(message: string, forOwnOffers: boolean) {
        const lower = message.toLowerCase()
        if (lower.includes('no_verified_account') || lower.includes('verify on a minecraft account'))
            return 'Verify a Minecraft account first to manage your own offers.'
        if (forOwnOffers && lower.includes('401'))
            return 'Sign in with Google to load your own lowball offers.'
        return message
    }

    async function loadOwnOffers() {
        setViewMode('own')
        setError(null)
        setIsLoading(true)
        try {
            const newOffers = await getOwnLowballOffers({ limit: 100 })
            setOffers(newOffers)
        } catch (error) {
            setOffers([])
            if (error instanceof SkyApiClientError)
                setError(normalizeError(error.message, true))
            else
                setError('Failed to load your lowball offers.')
        } finally {
            setIsLoading(false)
        }
    }

    async function loadOffersByItem() {
        if (!itemTag.trim()) {
            setError('Enter an item tag to load public lowball offers.')
            return
        }

        setViewMode('item')
        setError(null)
        setIsLoading(true)
        try {
            const newOffers = await getItemLowballOffers(itemTag.trim(), { limit: 100 })
            setOffers(newOffers)
        } catch {
            setOffers([])
            setError('Failed to load lowball offers for that item tag.')
        } finally {
            setIsLoading(false)
        }
    }

    async function removeOffer(offerId: string) {
        try {
            await deleteLowballOffer(offerId)
            setOffers(current => current.filter(offer => offer.offerId !== offerId))
            toast.success('Lowball offer removed.')
        } catch (error) {
            if (error instanceof SkyApiClientError)
                toast.error(normalizeError(error.message, true))
            else
                toast.error('Failed to remove the lowball offer.')
        }
    }

    return (
        <Container>
            <div className="d-flex gap-2 flex-wrap mb-3">
                <Button
                    variant={viewMode === 'own' ? 'primary' : 'outline-primary'}
                    disabled={!props.canLoadOwnOffers}
                    onClick={() => {
                        void loadOwnOffers()
                    }}
                >
                    My Offers
                </Button>
                <Button
                    variant={viewMode === 'item' ? 'primary' : 'outline-primary'}
                    onClick={() => {
                        void loadOffersByItem()
                    }}
                >
                    Browse By Item Tag
                </Button>
            </div>
            <InputGroup>
                <Form.Control
                    value={itemTag}
                    onChange={event => {
                        setItemTag(event.target.value.toUpperCase())
                    }}
                    onKeyDown={event => {
                        if (event.key === 'Enter') {
                            event.preventDefault()
                            void loadOffersByItem()
                        }
                    }}
                    placeholder="Enter an item tag, for example HYPERION"
                />
                <Button
                    variant="outline-secondary"
                    onClick={() => {
                        void loadOffersByItem()
                    }}
                >
                    Load Offers
                </Button>
            </InputGroup>
            <hr />
            {error ? <p className="text-danger">{error}</p> : null}
            {isLoading
                ? getLoadingElement()
                : offers.length === 0
                  ? <p className="text-muted">No lowball offers found for the current view.</p>
                  : offers.map(offer => (
                        <Card key={offer.offerId} style={{ marginBottom: '15px' }}>
                            <Card.Header>
                                <Card.Title>
                                    <img
                                        src={`https://sky.coflnet.com/static/icon/${offer.itemTag}`}
                                        alt=""
                                        style={{ marginRight: 10 }}
                                        crossOrigin="anonymous"
                                        height={24}
                                    />
                                    {removeMinecraftColorCoding(offer.itemName || convertTagToName(offer.itemTag || ''))}
                                    {offer.itemCount > 1 ? ` x${offer.itemCount}` : ''}
                                    {viewMode === 'own' ? (
                                        <DeleteIcon
                                            onClick={() => {
                                                void removeOffer(offer.offerId)
                                            }}
                                            color="error"
                                            style={{ float: 'right', cursor: 'pointer' }}
                                        />
                                    ) : null}
                                </Card.Title>
                            </Card.Header>
                            <Card.Body>
                                <p>
                                    <strong>Asking Price: </strong>
                                    <Number number={offer.askingPrice} /> Coins
                                </p>
                                <p>
                                    <strong>Item Tag: </strong>
                                    {offer.itemTag}
                                </p>
                                <p className="text-muted" style={{ fontSize: '0.85em' }}>
                                    {new Date(offer.createdAt).toLocaleString()}
                                </p>
                            </Card.Body>
                        </Card>
                    ))}
        </Container>
    )
}
