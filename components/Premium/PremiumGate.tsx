import type { ReactNode, Ref } from 'react'
import Link from 'next/link'
import LockIcon from '@mui/icons-material/Lock'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import styles from './PremiumGate.module.css'

interface Props {
    /** What is locked and which tier unlocks it. */
    message: ReactNode
    disclosureRef?: Ref<HTMLDetailsElement>
    /** Tier preselected on the premium page. */
    requiredTier: 'premium' | 'premium_plus' | 'starter'
    /** Signed in users are sent to the premium page, everyone else gets the sign-in button. */
    isSignedIn: boolean
}

export function PremiumGate({ message, requiredTier, isSignedIn, disclosureRef }: Props) {
    return (
        <details ref={disclosureRef} className={styles.gate} data-cy="premium-gate">
            <summary className="d-inline-flex text-muted p-1 list-unstyled" aria-label="Show premium access options" title="Premium access options">
                <LockIcon fontSize="small" aria-hidden="true" />
            </summary>
            <div className="d-flex align-items-center flex-wrap gap-2 border rounded p-2 small text-muted">
                <span>{message}</span>
                {isSignedIn ? (
                    <Link href={`/premium?tier=${requiredTier}`} className="btn btn-sm btn-outline-secondary">
                        Go to Premium
                    </Link>
                ) : (
                    <GoogleSignIn />
                )}
            </div>
        </details>
    )
}
