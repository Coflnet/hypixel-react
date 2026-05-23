'use client'
import Image from 'next/image'
import React, { useState, useEffect } from 'react'
import { Alert, Button } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import { convertTagToName } from '../../utils/Formatter'
import Number from '../Number/Number'
import { getGetApiFlipFusionMultistepQueryKey, useGetApiFlipFusion, useGetApiFlipFusionMultistep } from '../../api/_generated/skyApi'
import { GenericFlipList, SortOption } from '../GenericFlipList'
import { FuseFlip, FusionStep } from '../../api/_generated/skyApi.schemas'
import { hasHighEnoughPremium, PREMIUM_RANK } from '../../utils/PremiumTypeUtils'
import Link from 'next/link'
import { getGeneratedApiErrorMessage, hasSuccessfulArrayResponse, isGeneratedPremiumRequired } from '../../utils/GeneratedApiResponseUtils'

const SORT_OPTIONS: SortOption<FuseFlip>[] = [
    {
        label: 'Profit',
        value: 'profit',
        sortFunction: (crafts: FuseFlip[]) => crafts.sort((a, b) => b.outputValue - b.inputCost - (a.outputValue - a.inputCost))
    },
    {
        label: 'Output Value',
        value: 'outputValue',
        sortFunction: (crafts: FuseFlip[]) => crafts.sort((a, b) => b.outputValue - a.outputValue)
    },
    {
        label: 'Input Cost',
        value: 'inputCost',
        sortFunction: (crafts: FuseFlip[]) => crafts.sort((a, b) => b.inputCost - a.inputCost)
    },
    {
        label: 'Volume',
        value: 'volume',
        sortFunction: crafts => crafts.sort((a, b) => b.volume - a.volume)
    }
]

export function FusionFlips() {
    const [showMultiStep, setShowMultiStep] = useState(false)
    const [googleToken, setGoogleToken] = useState('')
    const baseQuery = useGetApiFlipFusion()
    const baseResponse = baseQuery.data
    const flips = hasSuccessfulArrayResponse<FuseFlip>(baseResponse) ? baseResponse.data : []
    const multiStepQuery = useGetApiFlipFusionMultistep({
        fetch: googleToken ? { headers: { GoogleToken: googleToken } } : undefined,
        query: {
            enabled: showMultiStep,
            queryKey: [...getGetApiFlipFusionMultistepQueryKey(), googleToken],
            retry: false
        }
    })
    const multiStepResponse = multiStepQuery.data
    const multiStepFlips = hasSuccessfulArrayResponse<FuseFlip>(multiStepResponse) ? multiStepResponse.data : []
    const multiStepLoading = multiStepQuery.isLoading && !multiStepResponse
    const displayedFlips: FuseFlip[] = showMultiStep ? multiStepFlips : flips
    const multiStepAccessError = showMultiStep && (multiStepResponse?.status === 401 || multiStepResponse?.status === 403 || isGeneratedPremiumRequired(multiStepResponse?.data))
    const errorMessage = showMultiStep
        ? getGeneratedApiErrorMessage(multiStepResponse, multiStepQuery.error, 'Unable to load multi-step fusion flips right now')
        : getGeneratedApiErrorMessage(baseResponse, baseQuery.error, 'Unable to load fusion flips right now')
    const [hasPremium, setHasPremium] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    useEffect(() => {
        if (typeof window === 'undefined') return
        const token = sessionStorage.getItem('googleId') ?? localStorage.getItem('googleId') ?? ''
        setGoogleToken(token)
        setIsLoggedIn(!!token)
        if (token) {
            api.refreshLoadPremiumProducts(
                products => {
                    setHasPremium(hasHighEnoughPremium(products, PREMIUM_RANK.STARTER))
                },
                () => setHasPremium(false)
            )
        }
    }, [])

    function renderStepDetails(step: FusionStep) {
        return (
            <div key={`${step.output}-${JSON.stringify(step.inputs)}`} style={{ paddingLeft: '10px', borderLeft: '2px solid #6c5ce7', marginBottom: '4px' }}>
                <span style={{ color: '#6c5ce7', fontWeight: 'bold' }}>Step: </span>
                {step.inputs
                    ? Object.keys(step.inputs).map((input, idx) => (
                          <span key={input}>
                              {idx > 0 && ' + '}
                              <Image
                                  crossOrigin="anonymous"
                                  src={api.getItemImageUrl({ tag: input }) || ''}
                                  height="16"
                                  width="16"
                                  alt=""
                                  style={{ marginRight: '2px' }}
                                  loading="lazy"
                              />
                              {convertTagToName(input)} x{step.inputs![input]}
                          </span>
                      ))
                    : null}
                <span> → </span>
                {step.output && (
                    <>
                        <Image
                            crossOrigin="anonymous"
                            src={api.getItemImageUrl({ tag: step.output }) || ''}
                            height="16"
                            width="16"
                            alt=""
                            style={{ marginRight: '2px' }}
                            loading="lazy"
                        />
                        {convertTagToName(step.output)} x{step.outputCount}
                    </>
                )}
            </div>
        )
    }

    function renderFlipContent(flip: FuseFlip) {
        return (
            <>
                <h4>{getCraftHeader(flip)}</h4>
                {flip.steps && flip.steps.length > 1 && (
                    <p>
                        <span style={{ color: '#6c5ce7', fontWeight: 'bold' }}>Multi-step ({flip.depth} levels)</span>
                    </p>
                )}
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Input Cost:</span> <Number number={Math.round(flip.inputCost)} /> Coins
                </p>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Output Value:</span> <Number number={Math.round(flip.outputValue)} /> Coins
                </p>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Output Count:</span> <Number number={Math.round(flip.outputCount)} />
                </p>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Volume:</span> <Number number={Math.round(flip.volume)} />
                </p>
                <hr />
                {flip.steps && flip.steps.length > 1 ? (
                    <>
                        <p style={{ fontWeight: 'bold' }}>Fusion Steps:</p>
                        {flip.steps.map(step => renderStepDetails(step))}
                    </>
                ) : flip.inputs ? (
                    Object.keys(flip.inputs).map(input => (
                        <p key={input}>
                            <Image
                                crossOrigin="anonymous"
                                src={api.getItemImageUrl({ tag: input }) || ''}
                                height="24"
                                width="24"
                                alt=""
                                style={{ marginRight: '5px' }}
                                loading="lazy"
                            />
                            {convertTagToName(input) + ' (' + flip.inputs![input] + 'x)'}
                        </p>
                    ))
                ) : null}
            </>
        )
    }

    function getCraftHeader(flip: FuseFlip): React.JSX.Element {
        if (!flip.output) {
            return <span>-</span>
        }
        return (
            <div>
                <span>
                    <Image
                        crossOrigin="anonymous"
                        src={
                            api.getItemImageUrl({
                                tag: flip.output
                            }) || ''
                        }
                        height="32"
                        width="32"
                        alt=""
                        style={{ marginRight: '5px' }}
                        loading="lazy"
                    />
                    {convertTagToName(flip.output)}
                </span>
            </div>
        )
    }

    function filterFunction(flip: FuseFlip, nameFilter: string | null | undefined, minimumProfit: number): boolean {
        let nameMatch = true
        let inputs = flip.inputs ? Object.keys(flip.inputs).map(input => convertTagToName(input).toLowerCase()) : []
        let outputMatch = flip.output && nameFilter ? convertTagToName(flip.output).toLowerCase().includes(nameFilter.toLowerCase()) : false
        if (nameFilter && !inputs.find(input => nameFilter && input.includes(nameFilter.toLowerCase())) && !outputMatch) {
            nameMatch = false
        }
        const profitMatch = flip.outputValue - flip.inputCost >= minimumProfit
        return nameMatch && profitMatch
    }

    function censoredItemGenerator(): FuseFlip {
        return {
            inputCost: 42,
            outputCount: 69,
            outputValue: 123123,
            volume: 123123,
            inputVolume: 0,
            inputs: null,
            output: null,
            steps: null,
            depth: 1
        }
    }

    return (
        <>
            <p>
                This is a curated list of profitable Skyblock Fusion Flips in Hypixel SkyBlock — find opportunities to fuse shards and sell the fused shard for a profit.
                The list highlights input cost, output value, output count and trade volume so you can quickly spot high-margin fusion flips. This is one of the
                newest Skyblock money making methods introduced with the the <strong>Galatea Foraging update</strong>.
            </p>
            <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={showMultiStep}
                        onChange={e => setShowMultiStep(e.target.checked)}
                    />
                    Show Multi-Step Fusions (up to 3 levels)
                </label>
                {showMultiStep && (
                    hasPremium ? (
                        <span style={{ color: '#2ecc71', fontSize: '0.9em' }}>✅ Included in your premium tier</span>
                    ) : (
                        <Link href="https://sky.coflnet.com/premium?tier=starter_premium" target="_blank" style={{ color: '#6c5ce7', fontSize: '0.9em' }}>
                            🔒 Requires starter premium — combine multiple fusions for higher profit margins
                        </Link>
                    )
                )}
                {multiStepLoading && showMultiStep && <span>Loading...</span>}
            </div>
            <details>
                <summary>How to profit of hypixel skyblock fusion flipping</summary>
                <ol>
                    <li>Pick a fusion flip that has a positive profit from the list below.</li>
                    <li>Buy order the displayed amount of each shard</li>
                    <li>Go to the fusion machine on galatea, select first one then the other shard and fuse them.</li>
                    <li>Create a sell order on the bazaar with the resulting shards</li>
                    <li>Repeat when margins and volume look healthy.</li>
                </ol>
            </details>
            <details>
                <summary>Why Galatea Foraging matters</summary>
                <p>
                    The Galatea Foraging update introduced shards and shard fusion. The prices of shards can fluctuate widly throughout the week and create new
                    fusion flipping opportunities giving you the chance to profit from these changes.
                </p>
            </details>
            <details>
                <summary>What do the columns mean?</summary>
                <p>
                    <strong>Input Cost:</strong> Estimated total cost to obtain all inputs required for the fusion.
                </p>
                <p>
                    <strong>Output Value:</strong> Typical market value of the fused item. A useful proxy for expected sale price.
                </p>
                <p>
                    <strong>Output Count:</strong> How many items the craft produces.
                </p>
                <p>
                    <strong>Volume:</strong> Estimated daily sales (higher volume = easier to sell).
                </p>
            </details>
            <br />
            {baseQuery.isLoading && !baseResponse ? (
                <p>Loading fusion flips…</p>
            ) : errorMessage ? (
                <Alert variant={multiStepAccessError ? 'warning' : 'danger'}>{errorMessage}</Alert>
            ) : (
                <GenericFlipList
                    items={displayedFlips}
                    sortOptions={SORT_OPTIONS}
                    renderFlipContentAction={renderFlipContent}
                    filterFunction={filterFunction}
                    getItemKeyAction={flip => flip.output || `${JSON.stringify(flip)}`}
                    getFlipLink={flip => (flip.output ? `https://sky.coflnet.com/item/${flip.output}` : undefined)}
                    censoredItemGenerator={censoredItemGenerator}
                    premiumMessage={showMultiStep ? "Multi-step fusion flips require starter premium or better" : "The top 3 flips can only be seen with starter premium or better"}
                    clickMessage="Click on a flip for price history"
                    showColumns={true}
                    emptyState={
                        !showMultiStep && displayedFlips.length === 0 ? (
                            <Alert variant="info" style={{ marginBottom: 0, maxWidth: '760px' }}>
                                <p style={{ marginBottom: '10px' }}>
                                    No single-step fusion flips are available right now. This is common while the fusion market is quiet.
                                </p>
                                <p style={{ marginBottom: hasPremium ? '10px' : 0 }}>
                                    Check <strong>Show Multi-Step Fusions</strong> to include deeper fusion chains.
                                </p>
                                {hasPremium ? (
                                    <Button size="sm" onClick={() => setShowMultiStep(true)}>
                                        Enable Multi-Step Fusions
                                    </Button>
                                ) : null}
                            </Alert>
                        ) : (
                            <p style={{ marginBottom: 0 }}>
                                No fusion flips are available right now. Please check again shortly.
                            </p>
                        )
                    }
                />
            )}
        </>
    )
}
