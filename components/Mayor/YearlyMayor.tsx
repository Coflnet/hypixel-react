'use client'
import { useGetApiMayorYear } from '../../api/_generated/skyApi'
import { MayorDetailsDisplay } from './MayorDetailsDisplay'

type Props = {
  year: string
}

export function YearlyMayor({ year }: Props) {
  const yearInt = Number.parseInt(year, 10)
  const isValidYear = Number.isInteger(yearInt)
  const { data: mayorYearData, isLoading, error } = useGetApiMayorYear(
    isValidYear ? yearInt : 0,
    {
      query: {
        enabled: isValidYear,
      },
    },
  )

  if (!isValidYear) {
    return <div>Invalid year</div>
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error loading mayor data for year {year}</div>
  }

  const elections = mayorYearData?.data
    ? Array.isArray(mayorYearData.data)
      ? mayorYearData.data
      : [mayorYearData.data]
    : []

  return <MayorDetailsDisplay elections={elections} isSingleYear={true} year={year} />
}
