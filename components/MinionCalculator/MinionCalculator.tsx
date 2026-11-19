'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { Alert, Badge, Button, Col, Form, Row, Spinner, Table } from 'react-bootstrap'
import api from '../../api/ApiHelper'

interface Props {
    initialRanking: MinionRankingResponse
    initialOptions: MinionRankingOptions
}

const presets: { label: string; description: string; options: Partial<MinionRankingOptions> }[] = [
    { label: 'Collect daily', description: '24 hours', options: { offlineHours: 24, hopper: 'none', derpy: false } },
    { label: 'Collect every Derpy', description: '124 days', options: { offlineHours: 2976, hopper: 'none', derpy: true } },
    { label: 'Leave for years', description: '5 years', options: { offlineHours: 43800, hopper: 'enchanted', derpy: false } }
]

const formatNumber = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })

function toSearchParams(options: MinionRankingOptions) {
    const params = new URLSearchParams()
    Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== '') params.set(key, String(value))
    })
    return params
}

export function MinionCalculator({ initialRanking, initialOptions }: Props) {
    const router = useRouter()
    const [options, setOptions] = useState(initialOptions)
    const [offlineHoursInput, setOfflineHoursInput] = useState(String(initialOptions.offlineHours))
    const [budgetInput, setBudgetInput] = useState(initialOptions.budget === undefined ? '' : String(initialOptions.budget))
    const [speedBoostInput, setSpeedBoostInput] = useState(String(initialOptions.speedBoost * 100))
    const [limitInput, setLimitInput] = useState(String(initialOptions.limit))
    const [ranking, setRanking] = useState(initialRanking)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)

    async function calculate(nextOptions: MinionRankingOptions) {
        nextOptions = {
            ...nextOptions,
            offlineHours: Math.max(1, nextOptions.offlineHours || 1),
            speedBoost: Math.max(0, nextOptions.speedBoost || 0),
            limit: Math.min(50, Math.max(1, nextOptions.limit || 1))
        }
        setOptions(nextOptions)
        setOfflineHoursInput(String(nextOptions.offlineHours))
        setBudgetInput(nextOptions.budget === undefined ? '' : String(nextOptions.budget))
        setSpeedBoostInput(String(nextOptions.speedBoost * 100))
        setLimitInput(String(nextOptions.limit))
        setLoading(true)
        setError(false)
        router.replace(`/minions?${toSearchParams(nextOptions).toString()}`, { scroll: false })

        try {
            const nextRanking = await api.getBestMinions(nextOptions)
            setRanking(nextRanking)
        } catch {
            setRanking({ minions: [], generatedAt: '' })
            setError(true)
        } finally {
            setLoading(false)
        }
    }

    function submit(event: FormEvent) {
        event.preventDefault()
        calculate({
            ...options,
            offlineHours: Number(offlineHoursInput),
            budget: budgetInput === '' ? undefined : Number(budgetInput),
            speedBoost: Number(speedBoostInput) / 100,
            limit: Number(limitInput)
        })
    }

    const rows = ranking.minions ?? []

    return (
        <section aria-label="Minion calculator">
            <div className="mb-3">
                <h2 className="h4">Start with your collection plan</h2>
                <div className="d-flex flex-wrap gap-2">
                    {presets.map(preset => (
                        <Button key={preset.label} variant="outline-primary" onClick={() => calculate({ ...options, ...preset.options })} disabled={loading}>
                            {preset.label} <small className="d-block">{preset.description}</small>
                        </Button>
                    ))}
                </div>
            </div>

            <Form onSubmit={submit} className="border rounded p-3 mb-4">
                <Row className="g-3">
                    <Col md={4} lg={3}>
                        <Form.Label htmlFor="offlineHours">Hours between collections</Form.Label>
                        <Form.Control
                            id="offlineHours"
                            type="number"
                            min={1}
                            step="any"
                            value={offlineHoursInput}
                            onChange={event => setOfflineHoursInput(event.target.value)}
                        />
                    </Col>
                    <Col md={4} lg={3}>
                        <Form.Label htmlFor="budget">Setup budget (optional)</Form.Label>
                        <Form.Control
                            id="budget"
                            type="number"
                            min={0}
                            placeholder="No limit"
                            value={budgetInput}
                            onChange={event => setBudgetInput(event.target.value)}
                        />
                    </Col>
                    <Col md={4} lg={3}>
                        <Form.Label htmlFor="objective">Rank by</Form.Label>
                        <Form.Select
                            id="objective"
                            value={options.objective}
                            onChange={event => setOptions({ ...options, objective: event.target.value as MinionRankingOptions['objective'] })}
                        >
                            <option value="coins">Coins per day</option>
                            <option value="experience">Skill XP per day</option>
                        </Form.Select>
                    </Col>
                    <Col md={4} lg={3}>
                        <Form.Label htmlFor="speedBoost">Additive speed boost (%)</Form.Label>
                        <Form.Control
                            id="speedBoost"
                            type="number"
                            min={0}
                            step="any"
                            value={speedBoostInput}
                            onChange={event => setSpeedBoostInput(event.target.value)}
                        />
                    </Col>
                    <Col md={4} lg={3}>
                        <Form.Label htmlFor="buy">Buy ingredients with</Form.Label>
                        <Form.Select
                            id="buy"
                            value={options.buy}
                            onChange={event => setOptions({ ...options, buy: event.target.value as MinionRankingOptions['buy'] })}
                        >
                            <option value="instant">Instant buys</option>
                            <option value="order">Buy orders</option>
                        </Form.Select>
                    </Col>
                    <Col md={4} lg={3}>
                        <Form.Label htmlFor="sell">Sell products with</Form.Label>
                        <Form.Select
                            id="sell"
                            value={options.sell}
                            onChange={event => setOptions({ ...options, sell: event.target.value as MinionRankingOptions['sell'] })}
                        >
                            <option value="offer">Sell offers</option>
                            <option value="instant">Instant sells</option>
                            <option value="npc">NPC sales</option>
                        </Form.Select>
                    </Col>
                    <Col md={4} lg={3}>
                        <Form.Label htmlFor="hopper">Hopper</Form.Label>
                        <Form.Select
                            id="hopper"
                            value={options.hopper}
                            onChange={event => setOptions({ ...options, hopper: event.target.value as MinionRankingOptions['hopper'] })}
                        >
                            <option value="none">None</option>
                            <option value="budget">Budget Hopper</option>
                            <option value="enchanted">Enchanted Hopper</option>
                        </Form.Select>
                    </Col>
                    <Col md={4} lg={3}>
                        <Form.Label htmlFor="limit">Results</Form.Label>
                        <Form.Control id="limit" type="number" min={1} max={50} value={limitInput} onChange={event => setLimitInput(event.target.value)} />
                    </Col>
                    <Col xs={12} className="d-flex flex-wrap gap-4">
                        <Form.Check
                            id="compaction"
                            type="switch"
                            label="Allow Super Compactor 3000"
                            checked={options.compaction}
                            onChange={event => setOptions({ ...options, compaction: event.target.checked })}
                        />
                        <Form.Check
                            id="derpy"
                            type="switch"
                            label="Derpy is active"
                            checked={options.derpy}
                            onChange={event => setOptions({ ...options, derpy: event.target.checked })}
                        />
                    </Col>
                    <Col xs={12}>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Spinner size="sm" aria-label="Calculating" /> : 'Calculate ranking'}
                        </Button>
                    </Col>
                </Row>
            </Form>

            {error ? <Alert variant="danger">The ranking could not be loaded. Change an input or try again shortly.</Alert> : null}
            {ranking.generatedAt ? <p className="text-body-secondary">Prices read {new Date(ranking.generatedAt).toLocaleString()}.</p> : null}

            <Table responsive striped hover className="align-middle">
                <thead>
                    <tr>
                        <th scope="col">Rank</th>
                        <th scope="col">Minion</th>
                        <th scope="col">Coins/day</th>
                        <th scope="col">XP/day</th>
                        <th scope="col">Setup / payback</th>
                        <th scope="col">Storage</th>
                        <th scope="col">Products and limits</th>
                    </tr>
                </thead>
                <tbody data-cy="minion-ranking">
                    {rows.map((minion, index) => (
                        <tr key={`${minion.name}-${minion.tier}`}>
                            <td>{index + 1}</td>
                            <td>
                                <strong>{minion.name ?? 'Unknown minion'}</strong>
                                <div>Tier {minion.tier}</div>
                                <small>{formatNumber.format(minion.secondsBetweenHarvests)} seconds per harvest</small>
                            </td>
                            <td>{formatNumber.format(minion.coinsPerDay)}</td>
                            <td>{formatNumber.format(minion.experiencePerDay)}</td>
                            <td>
                                {formatNumber.format(minion.setupCost)} coins
                                <div>{minion.paybackDays == null ? 'No payback' : `${formatNumber.format(minion.paybackDays)} days`}</div>
                            </td>
                            <td>
                                {formatNumber.format(minion.hoursToFill)} hours
                                <div>
                                    <Badge bg={minion.storageLimited ? 'warning' : 'success'} text={minion.storageLimited ? 'dark' : undefined}>
                                        {minion.storageLimited ? 'Fills before collection' : 'Runs until collection'}
                                    </Badge>
                                </div>
                                <small>{minion.compacted ? 'Compacted' : 'Not compacted'}</small>
                            </td>
                            <td>
                                {minion.itemPages?.map((itemPage, itemIndex) => (
                                    <span key={itemPage}>
                                        {itemIndex ? ', ' : ''}
                                        <Link href={itemPage}>{minion.productTags?.[itemIndex] ?? 'Price'}</Link>
                                    </span>
                                ))}
                                {minion.missingRequirements?.length ? (
                                    <div className="text-warning-emphasis">Requires: {minion.missingRequirements.join(', ')}</div>
                                ) : null}
                                {minion.unpricedIngredients?.length ? (
                                    <div className="text-warning-emphasis">Unpriced: {minion.unpricedIngredients.join(', ')}</div>
                                ) : null}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
            {!loading && !error && rows.length === 0 ? <Alert variant="info">No minions match this setup.</Alert> : null}
        </section>
    )
}
