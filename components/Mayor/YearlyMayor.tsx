"use client";
import { useGetApiMayorYear } from "../../api/_generated/skyApi";
import { MayorDetailsDisplay } from "./MayorDetailsDisplay";

type Props = {
    year: string;
};

export function YearlyMayor({ year }: Props) {
    const yearInt = parseInt(year, 10);
    const { data: mayorYearData, isLoading, error } = useGetApiMayorYear(yearInt, {
        query: {
            enabled: !isNaN(yearInt),
        },
    });

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error loading mayor data for year {year}</div>;
    }

    const elections = mayorYearData?.data ? (Array.isArray(mayorYearData.data) ? mayorYearData.data : [mayorYearData.data]) : [];

    return <MayorDetailsDisplay elections={elections} isSingleYear={true} year={year} />;
}