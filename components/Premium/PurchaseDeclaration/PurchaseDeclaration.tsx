'use client'
import { Alert, Button, Form } from 'react-bootstrap'
import type { PurchaseDeclarationState } from '../../../hooks/usePurchaseDeclaration'
import type { LegalLocale } from '../../../utils/LegalLinks'

// The early start declaration and the withdrawal instructions, shown before every Premium payment (prepaid and subscriptions).

const WITHDRAWAL_URLS: Record<LegalLocale, string> = {
    en: 'https://coflnet.com/withdrawal#withdraw-contract',
    de: 'https://coflnet.com/de/withdrawal#withdraw-contract'
}

const TEXT: Record<LegalLocale, { unavailable: string; retry: string; loading: string; withdrawal: string }> = {
    en: {
        unavailable: 'The current legal declaration could not be loaded. Purchasing is temporarily unavailable.',
        retry: 'Try again',
        loading: 'Loading declaration…',
        withdrawal: 'Withdrawal instructions and online withdrawal form'
    },
    de: {
        unavailable: 'Die aktuelle rechtliche Erklärung konnte nicht geladen werden. Der Kauf ist vorübergehend nicht möglich.',
        retry: 'Erneut versuchen',
        loading: 'Erklärung wird geladen…',
        withdrawal: 'Widerrufsbelehrung und Online-Widerrufsformular'
    }
}

interface Props {
    state: PurchaseDeclarationState
    /** id of the checkbox, unique on the page */
    id: string
}

function DeclarationCheck({ state, id }: Props) {
    const text = TEXT[state.locale]
    if (state.error)
        return (
            <Alert variant="danger">
                {text.unavailable}{' '}
                <Button size="sm" variant="secondary" onClick={() => void state.reload()}>
                    {text.retry}
                </Button>
            </Alert>
        )
    if (!state.declaration) return <p role="status">{text.loading}</p>
    return (
        <Form.Check
            id={id}
            type="checkbox"
            checked={state.accepted}
            onChange={event => state.setAccepted(event.target.checked)}
            label={state.declaration.text}
        />
    )
}

/** the unticked declaration (the server's current text) and the link to the withdrawal instructions */
export default function PurchaseDeclaration({ state, id }: Props) {
    return (
        <div data-testid="purchase-declaration">
            <DeclarationCheck state={state} id={id} />
            <p>
                <a href={WITHDRAWAL_URLS[state.locale]} target="_blank" rel="noopener noreferrer">
                    {TEXT[state.locale].withdrawal}
                </a>
            </p>
        </div>
    )
}
