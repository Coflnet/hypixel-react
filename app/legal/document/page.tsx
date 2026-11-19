import { notFound } from 'next/navigation'
import LegalDocumentReader from './LegalDocumentReader'

const LEGAL_ORIGIN = 'https://coflnet.com'
const VERSION_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function comparisonUrl(documentUrl: URL, compareVersion?: string) {
    if (!compareVersion || !VERSION_PATTERN.test(compareVersion)) return undefined
    const match = documentUrl.pathname.match(/^(.*-(?:en|de)-)(\d{4}-\d{2}-\d{2})(\.md)$/)
    if (!match || compareVersion >= match[2]) return undefined
    return new URL(`${match[1]}${compareVersion}${match[3]}`, LEGAL_ORIGIN).toString()
}

export default async function LegalDocumentPage(props: { searchParams: Promise<{ url?: string; sha256?: string; compareVersion?: string }> }) {
    const { url, sha256, compareVersion } = await props.searchParams
    if (!url || !sha256?.match(/^[a-f0-9]{64}$/i)) notFound()

    let documentUrl: URL
    try {
        documentUrl = new URL(url)
    } catch {
        notFound()
    }
    if (documentUrl.origin !== LEGAL_ORIGIN || !documentUrl.pathname.startsWith('/legal/archive/') || !documentUrl.pathname.endsWith('.md')) notFound()

    return (
        <LegalDocumentReader
            url={documentUrl.toString()}
            sha256={sha256.toLowerCase()}
            compareUrl={comparisonUrl(documentUrl, compareVersion)}
            compareVersion={compareVersion}
            german={documentUrl.pathname.includes('-de-')}
        />
    )
}
