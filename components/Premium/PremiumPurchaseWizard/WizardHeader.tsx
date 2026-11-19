'use client'
import { Ref } from 'react'
import { PremiumTier, getTierDisplayName } from './types'
import { STEP_NAMES, WizardChip } from './wizardFlow'
import styles from './PremiumPurchaseWizard.module.css'

interface Props {
    flow: number[]
    currentStep: number
    visibleStep: number
    totalSteps: number
    title: string
    titleId: string
    titleRef: Ref<HTMLHeadingElement>
    helper: string | null
    tier: PremiumTier | null
    chips: WizardChip[]
    /** while a checkout is opening the visitor cannot leave the step */
    chipsDisabled?: boolean
    onChipClick(step: number): void
}

const TIER_CHIP_CLASS: Record<PremiumTier, string> = {
    [PremiumTier.STARTER]: styles.chipStarter,
    [PremiumTier.PREMIUM]: styles.chipPremium,
    [PremiumTier.PREMIUM_PLUS]: styles.chipPremiumPlus
}

function StepProgress({ flow, currentStep }: { flow: number[]; currentStep: number }) {
    const currentIndex = flow.indexOf(currentStep)
    return (
        <ol className={styles.progress} aria-label="Purchase steps">
            {flow.map((step, index) => (
                <li key={step} className={index <= currentIndex ? styles.segmentDone : styles.segment} aria-current={index === currentIndex ? 'step' : undefined}>
                    <span className={styles.visuallyHidden}>{STEP_NAMES[step]}</span>
                </li>
            ))}
        </ol>
    )
}

function PencilIcon() {
    return (
        <svg className={styles.chipIcon} width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M11 2.5l2.5 2.5L6 12.5H3.5V10z" />
        </svg>
    )
}

function SummaryChips({ tier, chips, chipsDisabled, onChipClick }: Pick<Props, 'tier' | 'chips' | 'chipsDisabled' | 'onChipClick'>) {
    if (!tier && chips.length === 0) return null
    return (
        <div className={styles.chips}>
            {tier ? <span className={`${styles.chip} ${TIER_CHIP_CLASS[tier]}`}>{getTierDisplayName(tier)}</span> : null}
            {chips.map(chip => (
                <button
                    key={chip.step}
                    type="button"
                    className={`${styles.chip} ${styles.chipButton}`}
                    aria-label={chip.ariaLabel}
                    disabled={chipsDisabled}
                    onClick={() => onChipClick(chip.step)}
                >
                    {chip.value}
                    <PencilIcon />
                </button>
            ))}
        </div>
    )
}

/** segmented progress, "Step x of y", the step title with its helper line, and the choices made so far */
export default function WizardHeader(props: Props) {
    const { flow, currentStep, visibleStep, totalSteps, title, titleId, titleRef, helper } = props
    return (
        <div className={styles.header}>
            <StepProgress flow={flow} currentStep={currentStep} />
            <div className={styles.heading}>
                <p className={styles.eyebrow}>{`Step ${visibleStep} of ${totalSteps}`}</p>
                <h3 key={currentStep} id={titleId} ref={titleRef} tabIndex={-1} className={styles.title}>
                    {title}
                </h3>
                {helper ? <p className={styles.helper}>{helper}</p> : null}
            </div>
            <SummaryChips tier={currentStep > 1 ? props.tier : null} chips={props.chips} chipsDisabled={props.chipsDisabled} onChipClick={props.onChipClick} />
        </div>
    )
}
