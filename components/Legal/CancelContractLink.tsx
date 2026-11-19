'use client'
import { useLegalLocale } from '../../hooks/useLegalLocale'
import { getCancelContractLabel, getCancelContractUrl } from '../../utils/LegalLinks'

/** the link to Coflnet's contract cancellation page (§ 312k BGB), in the browser's language */
export default function CancelContractLink({ className }: { className?: string }) {
    const locale = useLegalLocale()
    return (
        <a href={getCancelContractUrl(locale)} className={className} target="_blank" rel="noreferrer" lang={locale} data-testid="cancel-contract-link">
            {getCancelContractLabel(locale)}
        </a>
    )
}
