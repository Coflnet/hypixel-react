"use client";
import { useMemo } from "react";
import { useGetApiMayor } from "../../api/_generated/skyApi";
import { MayorDetailsDisplay } from "./MayorDetailsDisplay";

const FIVE_YEARS_IN_MS = 5 * 365 * 24 * 60 * 60 * 1000;
const NOW = new Date()
const FIVE_YEARS_AGO = new Date(Date.now() - FIVE_YEARS_IN_MS);
NOW.setHours(0, 0, 0, 0);
FIVE_YEARS_AGO.setHours(0, 0, 0, 0);

export function AllMayors() {
    const { from, to } = useMemo(() => {
        return {
            from: FIVE_YEARS_AGO.toISOString(),
            to: NOW.toISOString()
        };
    }, []);

    const { data: mayorData, isLoading, error } = useGetApiMayor({ from, to });

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error loading mayor data</div>;
    }

    const elections = mayorData?.data ? (Array.isArray(mayorData.data) ? mayorData.data : [mayorData.data]) : [];

    return <MayorDetailsDisplay elections={elections} />;
}