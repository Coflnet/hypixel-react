'use client'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import { Card } from 'react-bootstrap'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { useMarketAnalysis } from '../../hooks/useMarketAnalysis'
import { DEFAULT_MARKET_ANALYSIS_DAYS, MARKET_ANALYSIS_DAY_OPTIONS } from './marketAnalysisUtils'

// Lazily loaded: the chunk (and its echarts usage) is only fetched once the section is first
// expanded - `next/dynamic` caches the import() itself, so toggling the section afterwards never
// re-requests the chunk. All data-fetching/caching lives in useMarketAnalysis (react-query), not in
// the body, so collapsing (which unmounts the body) never loses fetched data.
const MarketAnalysisBody = dynamic(() => import('./MarketAnalysisBody'), {
    ssr: false,
    loading: () => <div className="py-3">{getLoadingElement(<p>Loading market analysis...</p>)}</div>
})

interface Props {
    tag: string
    itemFilter?: ItemFilter
}

function MarketAnalysis(props: Props) {
    let [expanded, setExpanded] = useState(false)
    let [days, setDays] = useState(DEFAULT_MARKET_ANALYSIS_DAYS)

    const { sold, live } = useMarketAnalysis({ tag: props.tag, itemFilter: props.itemFilter, days, expanded })

    return (
        <Card className="mt-2 mb-4" data-testid="market-analysis">
            <Card.Header
                as="button"
                type="button"
                className="w-100 text-start bg-transparent border-0 d-flex align-items-center gap-2"
                aria-expanded={expanded}
                aria-controls="market-analysis-body"
                onClick={() => setExpanded(value => !value)}
                data-testid="market-analysis-toggle"
            >
                <span className="fw-semibold text-nowrap">Market analysis</span>
                <span className="text-muted small text-truncate flex-grow-1">Sell speed, price clustering &amp; live BIN pricing</span>
                <span
                    className="d-inline-flex flex-shrink-0"
                    style={{ transform: expanded ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s ease-in-out' }}
                >
                    <ExpandMoreIcon fontSize="small" />
                </span>
            </Card.Header>
            {expanded && (
                <Card.Body id="market-analysis-body">
                    <MarketAnalysisBody
                        days={days}
                        dayOptions={MARKET_ANALYSIS_DAY_OPTIONS}
                        onDaysChange={setDays}
                        sold={sold}
                        live={live}
                        onRetrySold={sold.retry}
                    />
                </Card.Body>
            )}
        </Card>
    )
}

export default MarketAnalysis
