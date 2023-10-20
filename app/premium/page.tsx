import React from 'react'
import RBContainer from '../../components/ReactBootstrapWrapper/Container'
import { getHeadMetadata } from '../../utils/SSRUtils'
import Premium from '../../components/Premium/Premium'
import { headers } from 'next/headers'
import requestIp from 'request-ip'

export default async function Page() {
    let headersList = headers()
    let ip = requestIp.getClientIp(JSON.parse(JSON.stringify(headersList)))
    let response = await fetch(`https://api.country.is/${encodeURIComponent(ip)}`)
    let country
    if (response.ok) {
        let result = await response.json()
        if (result.country) {
            country = result.country
        }
    }
    return (
        <>
            <RBContainer>
                <Premium userCountry={country} />
            </RBContainer>
        </>
    )
}

export const metadata = getHeadMetadata('Premium', 'See available premium options to support this project')
