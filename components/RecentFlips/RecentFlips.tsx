"use client";
import React from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getApiFlipUnknown, getGetApiFlipUnknownQueryKey, useGetApiFlipUnknown } from "../../api/_generated/skyApi";
import { FlipDetails } from "../../api/_generated/skyApi.schemas";
import api from "../../api/ApiHelper";
import Number from "../Number/Number";
import { GenericFlipList, SortOption } from "../GenericFlipList";
import Link from "next/link";
import { formatToPriceToShorten, getStyleForTier, getMinecraftColorCodedElement, convertTagToName } from "../../utils/Formatter";
import { toast } from "react-toastify";
import { Error } from "../Error/Error";

const SORT_OPTIONS: SortOption<FlipDetails>[] = [
    {
        label: "Profit ⇧",
        value: "profitAsc",
        sortFunction: flips => flips.sort((a, b) => (b.profit || 0) - (a.profit || 0))
    },
    {
        label: "Profit ⇩",
        value: "profitDesc",
        sortFunction: flips => flips.sort((a, b) => (a.profit || 0) - (b.profit || 0))
    },
    {
        label: "Price Paid ⇧",
        value: "pricePaidAsc",
        sortFunction: flips => flips.sort((a, b) => (b.pricePaid || 0) - (a.pricePaid || 0))
    },
    {
        label: "Price Paid ⇩",
        value: "pricePaidDesc",
        sortFunction: flips => flips.sort((a, b) => (a.pricePaid || 0) - (b.pricePaid || 0))
    },
    {
        label: "Sold For ⇧",
        value: "soldForAsc",
        sortFunction: flips => flips.sort((a, b) => (b.soldFor || 0) - (a.soldFor || 0))
    },
    {
        label: "Sold For ⇩",
        value: "soldForDesc",
        sortFunction: flips => flips.sort((a, b) => (a.soldFor || 0) - (b.soldFor || 0))
    },
];

export function RecentFlips() {
    let googleId = sessionStorage.getItem('googleId')
    const { data: { data: flips } = { data: [] } } = useGetApiFlipUnknown(undefined, {
        fetch: {
            headers: {
                GoogleToken: googleId || '',
            }
        }
    });

    if ((flips as any).slug) {
        return <Error title="API error while fetching recent flips" errorObject={flips} />
    }

    function renderFlipContent(flip: FlipDetails) {
    const displayName: string = String(flip.itemName ?? convertTagToName(flip.itemTag ?? ''))
        return (
            <>
                <h4>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <img
                            src={api.getItemImageUrl({ tag: flip.itemTag } as any) || ''}
                            alt="item icon"
                            style={{ width: 32, height: 32, verticalAlign: 'middle' }}
                        />
                        <span style={getStyleForTier(flip.tier ?? undefined)}>
                            {getMinecraftColorCodedElement(displayName)}
                        </span>
                    </span>
                </h4>
                <p>
                    <span style={{ width: "150px", float: "left" }}>Price Paid:</span> <Number number={flip.pricePaid} /> Coins
                </p>
                <p>
                    <span style={{ width: "150px", float: "left" }}>Sold For:</span> <Number number={flip.soldFor} /> Coins
                </p>
                <p>
                    <span style={{ width: "150px", float: "left" }}>Profit:</span> {formatToPriceToShorten(flip.profit || 0)} Coins
                </p>
                <p>
                    <span style={{ width: "150px", float: "left" }}>Sold after:</span> {formatDurationBetween(flip.buyTime, flip.sellTime)}
                </p>
                <p>
                    <span style={{ width: "150px", float: "left" }}>Sold:</span> {formatAgeFrom(flip.sellTime)}
                </p>
                {flip.flags && flip.flags !== "None" && (
                    <p>
                        <span style={{ color: "#FF5555" }}>Flags: {flip.flags}</span>
                    </p>
                )}
            </>
        );
    }

    // Helpers: accept Date or string (or undefined) as input
    function parseToDate(d?: string | Date | null): Date | undefined {
        if (!d) return undefined
        if (d instanceof Date) return d
        try {
            let s = d as string
            // Treat timestamps as UTC. If missing Z, append it.
            if (s.slice(-1) === 'Z') {
                const parsed = new Date(s)
                if (isNaN(parsed.getTime())) return undefined
                return parsed
            }
            const parsed = new Date(s + 'Z')
            if (isNaN(parsed.getTime())) return undefined
            return parsed
        } catch {
            return undefined
        }
    }

    function convertMsToLegible(ms: number): string {
        if (ms <= 0) return '0s'
        const sec = Math.floor(ms / 1000)
        const days = Math.floor(sec / 86400)
        const hours = Math.floor((sec % 86400) / 3600)
        const minutes = Math.floor((sec % 3600) / 60)
        const seconds = sec % 60
        if (days > 0) return `${days}d ${hours}h`
        if (hours > 0) return `${hours}h ${minutes}m`
        if (minutes > 0) return `${minutes}m ${seconds}s`
        return `${seconds}s`
    }

    function formatDurationBetween(buy?: string | Date | null, sell?: string | Date | null): string {
        const b = parseToDate(buy)
        const s = parseToDate(sell)
        if (!b || !s) return '-'
        const diff = s.getTime() - b.getTime()
        if (diff < 0) return '-'
        return convertMsToLegible(diff)
    }

    function formatAgeFrom(sell?: string | Date | null): string {
        const s = parseToDate(sell)
        if (!s) return '-'
        const diff = Date.now() - s.getTime()
        if (diff < 0) return 'in future'
        return `${convertMsToLegible(diff)} ago`
    }

    function onFlipClick(flip: FlipDetails) {
        if (flip.itemTag) {
            const url = `https://sky.coflnet.com/item/${flip.itemTag}`;
            window.open(url, "_blank");
        }
    }

    function filterFunction(flip: FlipDetails, nameFilter: string | null | undefined, minimumProfit: number): boolean {
        const nameMatch = !nameFilter || (flip.itemName?.toLowerCase().includes(nameFilter.toLowerCase()) ?? false);
        const profitMatch = (flip.profit || 0) >= minimumProfit;
        return nameMatch && profitMatch;
    }

    function censoredItemGenerator(flip: FlipDetails): FlipDetails {
        return {
            ...flip,
            itemName: "You cheated the blur ☺",
            pricePaid: 12345,
            soldFor: 69420,
            profit: -100000,
            itemTag: "BARRIER",
            buyTime: "-",
            sellTime: "-",
            flags: "None",
            tier: "UNKNOWN",
            finder: flip.finder,
            uId: flip.uId,
            originAuction: null,
            soldAuction: null,
            propertyChanges: null,
        };
    }

    return (
        <>
                <p>
                    These are flips we tracked but could not determine why they sold for so much.<br />
                    You can use this to see what items are currently being flipped and for how much profit.<br />
                </p>
                <p>
                    You can use these flips both to replicate them, basically skyblock copy trading, or find irl traders that moved coins.
                </p>
                <p>
                    Because the market insight this information provides possibly making you billions of coins this feature is exclusive to premium plus users.
                </p>
            <GenericFlipList
                items={flips}
                sortOptions={SORT_OPTIONS}
                onFlipClick={onFlipClick}
                getFlipLink={flip => (flip.itemTag ? `https://sky.coflnet.com/auction/${flip.originAuction}` : undefined)}
                renderFlipContentAction={renderFlipContent}
                filterFunction={filterFunction}
                getItemKeyAction={flip => flip.uId?.toString() || flip.itemTag || ''}
                censoredItemGenerator={censoredItemGenerator}
                premiumMessage="The top 3 flips can only be seen with starter premium or better"
                clickMessage="Click on a flip for the origin auction"
            />
        </>
    );
}