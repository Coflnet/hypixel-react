"use client";
import React from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getApiFlipUnknown, getGetApiFlipUnknownQueryKey, useGetApiFlipUnknown } from "../../api/_generated/skyApi";
import { FlipDetails } from "../../api/_generated/skyApi.schemas";
import api from "../../api/ApiHelper";
import Number from "../Number/Number";
import { GenericFlipList, SortOption } from "../GenericFlipList";
import Link from "next/link";
import { formatToPriceToShorten, getStyleForTier } from "../../utils/Formatter";
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
        return (
            <>
                <h4>
                    <span style={getStyleForTier(flip.tier ?? undefined)}>
                        {flip.itemName || flip.itemTag}
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
                    <span style={{ width: "150px", float: "left" }}>Bought:</span> {flip.buyTime}
                </p>
                <p>
                    <span style={{ width: "150px", float: "left" }}>Sold:</span> {flip.sellTime}
                </p>
                {flip.flags && flip.flags !== "None" && (
                    <p>
                        <span style={{ color: "#FF5555" }}>Flags: {flip.flags}</span>
                    </p>
                )}
            </>
        );
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
            <details>
                <summary>These are flips that were done but not found automatically</summary>
                <p>
                    These flips are gathered from the auction house and show the most recent profitable trades found by our system.<br />
                    You can use this to see what items are currently being flipped and for how much profit.<br />
                </p>
            </details>
            <GenericFlipList
                items={flips}
                sortOptions={SORT_OPTIONS}
                onFlipClick={onFlipClick}
                getFlipLink={flip => (flip.itemTag ? `https://sky.coflnet.com/item/${flip.itemTag}` : undefined)}
                renderFlipContentAction={renderFlipContent}
                filterFunction={filterFunction}
                getItemKeyAction={flip => flip.uId?.toString() || flip.itemTag || ''}
                censoredItemGenerator={censoredItemGenerator}
                premiumMessage="The top 3 flips can only be seen with starter premium or better"
                clickMessage="Click on a flip for further details"
            />
        </>
    );
}