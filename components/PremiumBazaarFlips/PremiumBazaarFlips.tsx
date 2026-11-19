'use client'
import Image from 'next/image'
import React, { useCallback, useEffect, useState } from 'react'
import { Alert, Badge, Button, ButtonGroup, Form, ListGroup } from 'react-bootstrap'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import api from '../../api/ApiHelper'
import Number from '../Number/Number'
import type { BazaarPlanOrder, BazaarPlanResponse } from '../../api/_generated/skyApi.schemas'
import { getGetApiModGoalsQueryKey, postApiFlipBazaarPlan, postApiFlipBazaarPlanTrack } from '../../api/_generated/skyApi'
import { GenericFlipList, SortOption } from '../GenericFlipList'
import PremiumNotifier from '../Premium/PremiumNotifier'
import styles from './PremiumBazaarFlips.module.css'
import { getGeneratedApiErrorMessage, getGeneratedApiSlug } from '../../utils/GeneratedApiResponseUtils'
import {
    BAZAAR_PLAN_BUDGET_KEY,
    BAZAAR_PLAN_HORIZON_KEY,
    BAZAAR_PLAN_MODE_KEY,
    BAZAAR_PLAN_SELL_TAX_KEY,
    getSetting,
    setSetting
} from '../../utils/SettingsUtils'
import {
    BAZAAR_PLAN_DEFAULT_HORIZON_HOURS,
    BAZAAR_PLAN_MODES,
    BazaarPlanModeChoice,
    buildBazaarPlanRequest,
    getConfidenceBadge,
    getDeadlineText,
    getTaxText,
    includesInvesting,
    parseBazaarPlanMode,
    validateBudget,
    validateHorizon,
    validateTax
} from '../../utils/BazaarPlanUtils'

const SORT_OPTIONS: SortOption<BazaarPlanOrder>[] = [
    {
        label: 'Plan order',
        value: 'rank',
        sortFunction: orders => orders
    },
    {
        label: 'Net profit ⇩',
        value: 'netProfit',
        sortFunction: orders => orders.sort((a, b) => (b.estimatedNetProfit || 0) - (a.estimatedNetProfit || 0))
    },
    {
        label: 'Shortest lock',
        value: 'lock',
        sortFunction: orders => orders.sort((a, b) => (a.capitalLockHorizonHours || 0) - (b.capitalLockHorizonHours || 0))
    }
]

const BUDGET_SOURCE_LABELS: Record<string, string> = {
    'purse-estimate': 'estimated as two thirds of your purse',
    request: 'your input'
}

function formatPrice(value?: number | null): string {
    return (value ?? 0).toLocaleString('en-US', { maximumFractionDigits: 1 })
}

export function PremiumBazaarFlips() {
    const queryClient = useQueryClient()
    const [googleToken, setGoogleToken] = useState('')
    const [prefsLoaded, setPrefsLoaded] = useState(false)
    const [mode, setMode] = useState<BazaarPlanModeChoice>('Active')
    const [horizon, setHorizon] = useState(String(BAZAAR_PLAN_DEFAULT_HORIZON_HOURS))
    // empty means "use the server's default", the input then shows the server's value
    const [budget, setBudget] = useState('')
    const [budgetEdited, setBudgetEdited] = useState(false)
    const [tax, setTax] = useState('')
    // what the query uses: text inputs settle for a moment so that typing "5000000" is one request, not seven
    const [applied, setApplied] = useState({ horizon: String(BAZAAR_PLAN_DEFAULT_HORIZON_HOURS), budget: '', tax: '' })
    const [now, setNow] = useState(0)
    const [tracking, setTracking] = useState<string | null>(null)

    useEffect(() => {
        const token = sessionStorage.getItem('googleId') ?? localStorage.getItem('googleId') ?? ''
        setGoogleToken(token)
        setMode(parseBazaarPlanMode(getSetting(BAZAAR_PLAN_MODE_KEY, 'Active')))
        const saved = {
            horizon: String(getSetting(BAZAAR_PLAN_HORIZON_KEY, BAZAAR_PLAN_DEFAULT_HORIZON_HOURS)),
            budget: String(getSetting(BAZAAR_PLAN_BUDGET_KEY, '')),
            tax: String(getSetting(BAZAAR_PLAN_SELL_TAX_KEY, ''))
        }
        setHorizon(saved.horizon)
        setBudget(saved.budget)
        setBudgetEdited(!!saved.budget)
        setTax(saved.tax)
        setApplied(saved)
        setNow(Date.now())
        setPrefsLoaded(true)
        const timer = setInterval(() => setNow(Date.now()), 5000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => setApplied({ horizon, budget, tax }), 400)
        return () => clearTimeout(timer)
    }, [horizon, budget, tax])

    const horizonError = includesInvesting(mode) ? validateHorizon(horizon) : null
    const budgetError = validateBudget(budget)
    const taxError = validateTax(tax)
    const valid = !horizonError && !budgetError && !taxError
    const appliedValid =
        !(includesInvesting(mode) && validateHorizon(applied.horizon)) && !validateBudget(applied.budget) && !validateTax(applied.tax)

    const query = useQuery({
        queryKey: ['bazaarPlan', googleToken, mode, includesInvesting(mode) ? applied.horizon : null, applied.budget, applied.tax],
        queryFn: () => postApiFlipBazaarPlan(buildBazaarPlanRequest(mode, applied.horizon, applied.budget, applied.tax), { headers: { GoogleToken: googleToken } }),
        // only settled, valid inputs are ever sent; a half typed value must not flip the query on and off
        enabled: !!googleToken && prefsLoaded && appliedValid,
        retry: false,
        staleTime: 0,
        placeholderData: keepPreviousData
    })
    const response = query.data
    const isFetching = query.isFetching
    const plan: BazaarPlanResponse | null = response?.status === 200 ? (response.data as BazaarPlanResponse) : null
    const isAccessError = response?.status === 401 || response?.status === 403
    const errorMessage =
        query.isError || (response && response.status !== 200 && !isAccessError)
            ? getGeneratedApiErrorMessage(response, query.error, 'Unable to load your bazaar plan right now') || 'Unable to load your bazaar plan right now'
            : null

    const handleAfterLogin = useCallback(() => {
        const token = sessionStorage.getItem('googleId') ?? localStorage.getItem('googleId') ?? ''
        // GoogleSignIn re-triggers this on every mount for an already-established session. Only refetch when the
        // token actually changed (a genuinely new login) to avoid an invalidate -> refetch -> remount -> re-login loop.
        if (token === googleToken) {
            return
        }
        setGoogleToken(token)
    }, [googleToken])

    function changeMode(value: BazaarPlanModeChoice) {
        setMode(value)
        setSetting(BAZAAR_PLAN_MODE_KEY, value)
    }

    function changeHorizon(value: string) {
        setHorizon(value)
        if (!validateHorizon(value)) {
            setSetting(BAZAAR_PLAN_HORIZON_KEY, value)
        }
    }

    function changeBudget(value: string) {
        setBudgetEdited(true)
        setBudget(value)
        if (!validateBudget(value)) {
            setSetting(BAZAAR_PLAN_BUDGET_KEY, value)
        }
    }

    function changeTax(value: string) {
        setTax(value)
        if (!validateTax(value)) {
            setSetting(BAZAAR_PLAN_SELL_TAX_KEY, value)
        }
    }

    async function track(order: BazaarPlanOrder) {
        if (!googleToken || !plan?.quote?.quoteId || !order.itemTag) {
            return
        }
        setTracking(order.itemTag)
        try {
            const result = await postApiFlipBazaarPlanTrack({ quoteId: plan.quote.quoteId, itemTag: order.itemTag }, { headers: { GoogleToken: googleToken } })
            const status: number = result.status
            if (status >= 200 && status < 300) {
                toast.success(
                    <span>
                        Tracking <i>{order.itemName}</i> in game — open your inventory to see the steps
                    </span>
                )
            } else if (getGeneratedApiSlug(result.data) === 'quote_expired') {
                toast.warn('This plan expired, it was refreshed. Please check the new prices.')
                query.refetch()
            } else {
                toast.error(getGeneratedApiErrorMessage(result, null, 'Unable to track this in game'))
            }
        } catch (error) {
            toast.error(getGeneratedApiErrorMessage(null, error, 'Unable to track this in game'))
        }
        setTracking(null)
        queryClient.invalidateQueries({ queryKey: getGetApiModGoalsQueryKey() })
    }

    const explanatorySection = (
        <div>
            <p>
                Your personal bazaar plan tells you what to order with your own budget: <strong>Active</strong> flips that complete within about an hour,{' '}
                <strong>Investing</strong> orders that you hold for up to the horizon you choose, or <strong>Both</strong> from one shared budget and one set
                of order slots. It is computed from the live order book, your open orders and the items you already hold.
            </p>
            <details>
                <summary>How should I read the confidence badge?</summary>
                <p>
                    The badge is about the whole cycle (buying everything and selling everything by the deadline). A green badge appears only when the
                    odds are proven to be above 95%. <em>unknown</em> means we have no proof, it does not mean the odds are bad or good. Active orders
                    carry no badge, they are short and judged by their live order book.
                </p>
            </details>
            <details>
                <summary>How to place a planned order</summary>
                <ol>
                    <li>Press &quot;Track in game&quot; on an order and open your inventory in Skyblock</li>
                    <li>The mod guides you: place the buy order at the entry price, claim, then list the sell offer at the exit price</li>
                    <li>The deadline starts with your first accepted buy order, replacement orders do not extend it</li>
                </ol>
            </details>
        </div>
    )

    const controls = (
        <div className={styles.controls} data-cy="plan-controls">
            <div className={styles.controlGroup}>
                <Form.Label className={styles.controlLabel}>Mode</Form.Label>
                <ButtonGroup aria-label="Plan mode">
                    {BAZAAR_PLAN_MODES.map(choice => (
                        <Button
                            key={choice}
                            variant={choice === mode ? 'primary' : 'outline-primary'}
                            aria-pressed={choice === mode}
                            data-cy={`plan-mode-${choice.toLowerCase()}`}
                            onClick={() => changeMode(choice)}
                        >
                            {choice}
                        </Button>
                    ))}
                </ButtonGroup>
            </div>
            {includesInvesting(mode) ? (
                <div className={styles.controlGroup}>
                    <Form.Label htmlFor="plan-horizon" className={styles.controlLabel}>
                        Investing horizon (hours)
                    </Form.Label>
                    <Form.Control
                        id="plan-horizon"
                        data-cy="plan-horizon"
                        type="number"
                        min={1}
                        max={48}
                        step="any"
                        value={horizon}
                        isInvalid={!!horizonError}
                        onChange={e => changeHorizon(e.target.value)}
                    />
                    <Form.Control.Feedback type="invalid" data-cy="plan-horizon-error">
                        {horizonError}
                    </Form.Control.Feedback>
                </div>
            ) : null}
            <div className={styles.controlGroup}>
                <Form.Label htmlFor="plan-budget" className={styles.controlLabel}>
                    Budget (coins)
                </Form.Label>
                <Form.Control
                    id="plan-budget"
                    data-cy="plan-budget"
                    type="text"
                    inputMode="decimal"
                    placeholder="two thirds of your purse"
                    // prefilled with what the server planned with until the user overrides it
                    value={budgetEdited || plan?.budgetCoins == null ? budget : String(plan.budgetCoins)}
                    onFocus={e => e.target.select()}
                    onBlur={() => {
                        if (!budget.trim()) {
                            setBudgetEdited(false)
                        }
                    }}
                    isInvalid={!!budgetError}
                    onChange={e => changeBudget(e.target.value)}
                />
                <Form.Control.Feedback type="invalid">{budgetError}</Form.Control.Feedback>
                {plan ? (
                    <Form.Text data-cy="plan-budget-source">
                        {plan.portfolio?.budgetCoins != null && plan.portfolio.budgetCoins !== plan.budgetCoins
                            ? `Budget ${formatPrice(plan.budgetCoins)} coins, planning with ${formatPrice(plan.portfolio.budgetCoins)} after open buy orders, ${BUDGET_SOURCE_LABELS[plan.budgetSource ?? ''] ?? plan.budgetSource}`
                            : `Planning with ${formatPrice(plan.budgetCoins)} coins, ${BUDGET_SOURCE_LABELS[plan.budgetSource ?? ''] ?? plan.budgetSource}`}
                        {budget.trim() ? (
                            <Button
                                variant="link"
                                size="sm"
                                onClick={() => {
                                    changeBudget('')
                                    setBudgetEdited(false)
                                }}
                            >
                                use the default
                            </Button>
                        ) : null}
                    </Form.Text>
                ) : null}
            </div>
            <div className={styles.controlGroup}>
                <Form.Label htmlFor="plan-tax" className={styles.controlLabel}>
                    Sell tax % (optional)
                </Form.Label>
                <Form.Control
                    id="plan-tax"
                    data-cy="plan-tax"
                    type="number"
                    min={0}
                    max={99}
                    step="any"
                    placeholder="assumed"
                    value={tax}
                    isInvalid={!!taxError}
                    onChange={e => changeTax(e.target.value)}
                />
                <Form.Control.Feedback type="invalid">{taxError}</Form.Control.Feedback>
            </div>
        </div>
    )

    if (!googleToken) {
        return (
            <div className={styles.alertWrapper}>
                {explanatorySection}
                {prefsLoaded ? (
                    <PremiumNotifier title="Log in to get your personal plan" showCta onAfterLogin={handleAfterLogin}>
                        <p>Your plan uses your verified Minecraft account, your purse and your open bazaar orders. Free accounts get a sample of the plan.</p>
                    </PremiumNotifier>
                ) : null}
            </div>
        )
    }

    const expiresAt = plan?.quote?.expiresAt ? new Date(plan.quote.expiresAt).getTime() : 0
    const isStale = !!plan && now > 0 && expiresAt > 0 && now > expiresAt

    function renderQuoteHeader() {
        if (!plan?.quote) {
            return null
        }
        return (
            <div className={styles.quoteHeader} data-cy="plan-quote">
                <span>
                    Generated {new Date(plan.quote.generatedAt).toLocaleTimeString()} · valid until {new Date(plan.quote.expiresAt).toLocaleTimeString()}
                </span>
                {isStale ? (
                    <Badge bg="warning" text="dark" data-cy="plan-stale">
                        stale — refresh
                    </Badge>
                ) : null}
                <Button size="sm" variant="outline-secondary" disabled={isFetching} onClick={() => query.refetch()} data-cy="plan-refresh">
                    Refresh
                </Button>
                {isFetching ? <span className={styles.updating}>updating…</span> : null}
            </div>
        )
    }

    function renderNotices() {
        if (!plan) {
            return null
        }
        return (
            <>
                {plan.warnings?.includes('orders_unavailable') ? (
                    <Alert variant="warning" data-cy="plan-orders-unavailable">
                        We could not read your open bazaar orders, so the plan may overlap with orders you already placed.
                    </Alert>
                ) : plan.accountState?.openOrdersEstimated ? (
                    <Alert variant="info" data-cy="plan-orders-estimated">
                        Some of your open order fills are estimates, the budget and slots below may be slightly off.
                    </Alert>
                ) : null}
                {plan.investingStatus === 'EmptyQualified' ? (
                    <Alert variant="info" data-cy="plan-empty-investing">
                        <strong>No Investing order qualifies right now.</strong> Investing orders are only recommended when the odds of buying and selling
                        everything by the deadline are proven to be above 95%, and no candidate has that proof at the moment. This is not an error.
                        <div className={styles.alternatives}>
                            {mode !== 'Active' ? (
                                <Button size="sm" variant="outline-primary" onClick={() => changeMode('Active')} data-cy="plan-alt-active">
                                    Show Active flips instead
                                </Button>
                            ) : null}
                            {mode === 'Investing' ? (
                                <Button size="sm" variant="outline-primary" onClick={() => changeMode('Both')} data-cy="plan-alt-both">
                                    Show Both
                                </Button>
                            ) : null}
                        </div>
                    </Alert>
                ) : null}
                {plan.investingStatus === 'Unavailable' ? (
                    <Alert variant="warning" data-cy="plan-unavailable-investing">
                        Investing data is not available yet, please try again in a few minutes.
                        <div className={styles.alternatives}>
                            <Button size="sm" variant="outline-secondary" onClick={() => query.refetch()}>
                                Retry
                            </Button>
                            {mode === 'Investing' ? (
                                <Button size="sm" variant="outline-primary" onClick={() => changeMode('Active')}>
                                    Show Active flips instead
                                </Button>
                            ) : null}
                        </div>
                    </Alert>
                ) : null}
            </>
        )
    }

    function renderRow(order: BazaarPlanOrder) {
        const badge = getConfidenceBadge(order.confidence)
        return (
            <div data-cy="plan-row" data-item-tag={order.itemTag}>
                <h4>
                    <Image
                        crossOrigin="anonymous"
                        src={api.getItemImageUrl({ tag: order.itemTag || '' }) || ''}
                        height="32"
                        width="32"
                        alt=""
                        style={{ marginRight: '5px' }}
                        loading="lazy"
                    />
                    {order.itemName}
                </h4>
                <p>
                    <span className={styles.rowLabel}>Mode:</span>
                    <Badge bg={order.mode === 'Investing' ? 'info' : 'secondary'}>{order.mode}</Badge>
                </p>
                <p>
                    <span className={styles.rowLabel}>Quantity:</span>
                    <Number number={order.originalQuantity} />x
                </p>
                <p>
                    <span className={styles.rowLabel}>Buy → sell:</span>
                    <span data-cy="plan-prices">
                        {formatPrice(order.entryPrice)} → {order.exitPrice == null ? 'n/a' : formatPrice(order.exitPrice)}
                    </span>{' '}
                    Coins
                </p>
                <p>
                    <span className={styles.rowLabel}>Net after tax:</span>
                    <span data-cy="plan-net">
                        <Number number={Math.round(order.estimatedNetProfit || 0)} /> Coins
                    </span>{' '}
                    <small className="text-muted">({getTaxText(order.sellTaxRate, order.taxSource)})</small>
                </p>
                <p data-cy="plan-lock">
                    <span className={styles.rowLabel}>Lock:</span>≤ {order.capitalLockHorizonHours} h
                </p>
                <small className="text-muted d-block mb-2">{getDeadlineText(order.deadlineSemantics, order.capitalLockHorizonHours)}</small>
                {badge ? (
                    <Badge bg={badge.variant} text={badge.variant === 'warning' ? 'dark' : undefined} data-cy="plan-badge" title={badge.tooltip ?? order.confidence?.reasonCodes?.join(', ')}>
                        {badge.text}
                    </Badge>
                ) : null}
                <div className="mt-2">
                    <Button size="sm" disabled={tracking === order.itemTag || isStale} onClick={() => track(order)} data-cy="plan-track">
                        Track in game
                    </Button>
                </div>
            </div>
        )
    }

    function filterFunction(order: BazaarPlanOrder, nameFilter: string | null | undefined, minimumProfit: number): boolean {
        const nameMatch = !nameFilter || (order.itemName?.toLowerCase().includes(nameFilter.toLowerCase()) ?? false)
        return nameMatch && (order.estimatedNetProfit || 0) >= minimumProfit
    }

    // The free sample is chosen by the server, so every row that arrives is shown as is (no blurred placeholders)
    function wrapRow(order: BazaarPlanOrder, _blur: boolean, key: string, _content: React.ReactNode, flipCardClass: string) {
        return (
            <div className={flipCardClass} key={key}>
                <ListGroup.Item style={{ height: '100%', padding: '15px' }}>{renderRow(order)}</ListGroup.Item>
            </div>
        )
    }

    const orders = plan?.orders ?? []
    const candidates = plan?.unqualifiedInvestingCandidates ?? []

    return (
        <div className={styles.alertWrapper}>
            {explanatorySection}
            {controls}
            {isAccessError ? <PremiumNotifier title="Log in to get your personal plan" messageFromApi={getGeneratedApiErrorMessage(response, null, '')} onAfterLogin={handleAfterLogin} /> : null}
            {errorMessage ? (
                <Alert variant="danger" data-cy="plan-error">
                    <p>{errorMessage}</p>
                    <Button variant="outline-danger" size="sm" onClick={() => query.refetch()} disabled={isFetching || !valid} data-cy="plan-retry">
                        Retry
                    </Button>
                </Alert>
            ) : null}
            {!valid ? <Alert variant="warning">Fix the highlighted inputs to load your plan.</Alert> : null}
            {!plan && isFetching && valid && !errorMessage ? <p data-cy="plan-loading">Computing your plan…</p> : null}
            {plan && !errorMessage ? (
                <>
                    {renderQuoteHeader()}
                    {renderNotices()}
                    {orders.length > 0 ? (
                        <GenericFlipList
                            items={orders}
                            sortOptions={SORT_OPTIONS}
                            renderFlipContentAction={renderRow}
                            filterFunction={filterFunction}
                            getItemKeyAction={order => `${order.mode}-${order.itemTag}`}
                            customItemWrapper={wrapRow}
                            clickMessage="Press Track in game on an order to follow it in Skyblock"
                            minimumPlaceholder="Minimum net profit"
                            emptyState={<p>No orders match your filter.</p>}
                        />
                    ) : plan.investingStatus !== 'EmptyQualified' && plan.investingStatus !== 'Unavailable' ? (
                        <Alert variant="info" data-cy="plan-empty">
                            No order fits your budget and free order slots right now. Try a larger budget or check again in a minute.
                        </Alert>
                    ) : null}
                    {(plan.hiddenCount ?? 0) > 0 ? (
                        <div data-cy="plan-premium-prompt">
                            <PremiumNotifier title={`+${plan.hiddenCount} more with Starter Premium`} onAfterLogin={handleAfterLogin}>
                                <p>You are seeing a sample of your plan. Starter Premium unlocks the complete ranked plan.</p>
                            </PremiumNotifier>
                        </div>
                    ) : null}
                    {candidates.length > 0 ? (
                        <details className={styles.candidates} data-cy="plan-candidates">
                            <summary>Unqualified investing candidates ({candidates.length}), not recommended</summary>
                            <p className="text-muted">
                                These are sized by a backward-looking heuristic and have <strong>no proven odds</strong>. They are shown for information only and are
                                not part of your plan or budget.
                            </p>
                            <ul>
                                {candidates.map(candidate => (
                                    <li key={candidate.itemTag}>
                                        {candidate.itemName}: {formatPrice(candidate.entryPrice)} → {candidate.exitPrice == null ? 'n/a' : formatPrice(candidate.exitPrice)},{' '}
                                        {candidate.originalQuantity}x, ≤ {candidate.capitalLockHorizonHours} h
                                    </li>
                                ))}
                            </ul>
                        </details>
                    ) : null}
                </>
            ) : null}
        </div>
    )
}
