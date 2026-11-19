'use client'
import { FocusEvent, useId, useRef } from 'react'
import { useOutsideClick } from '../../../hooks/useOutsideClick'
import { useIsTouchFirst } from '../../../hooks/useAutoplayPolicy'
import { FeatureMedia } from '../../../utils/FeatureMedia'
import { trackPremiumPageEvent } from '../../../utils/PremiumTracking'
import { usePremiumVariant } from '../../Premium/PremiumVariantContext'
import FeatureMediaBox from '../FeatureMedia/FeatureMediaBox'
import { closePreview, setOpenPreview, usePreviewState } from './previewStore'
import { useAnchoredPosition, useCloseOnUnmount, useDelayedAction, useEscapeToClose } from './usePreviewPopover'
import styles from './ComparePlans.module.css'

const OPEN_DELAY = 150
const CLOSE_DELAY = 120

interface Props {
    rowId: string
    featureId: string
    title: string
    short: string
    media: FeatureMedia
}

interface PopoverProps extends Props {
    id: string
    anchorRef: React.RefObject<HTMLElement | null>
    wrapperRef: React.RefObject<HTMLElement | null>
    buttonRef: React.RefObject<HTMLButtonElement | null>
}

/** mounted only while open, so its media is requested only then and torn down on close */
function PreviewPopover({ id, rowId, featureId, title, short, media, anchorRef, wrapperRef, buttonRef }: PopoverProps) {
    const variant = usePremiumVariant()
    const popoverRef = useRef<HTMLDivElement>(null)
    useAnchoredPosition(anchorRef, popoverRef)
    useOutsideClick(wrapperRef, () => closePreview(rowId))
    useEscapeToClose(() => closePreview(rowId), wrapperRef, buttonRef)

    return (
        <div id={id} ref={popoverRef} className={styles.popover} role="group" aria-label={`${title} preview`} tabIndex={-1} data-testid="compare-preview">
            <FeatureMediaBox
                featureId={featureId}
                title={title}
                media={media}
                compact
                onClipStart={trigger => trackPremiumPageEvent('clip play', variant, { feature: featureId, trigger, place: 'preview' })}
            />
            <div className={styles.popoverText}>
                <span className={styles.popoverTitle}>{title}</span>
                <span className={styles.popoverShort}>{short}</span>
            </div>
        </div>
    )
}

function PlayCircleIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="8" cy="8" r="6.5" />
            <path d="M6.5 5.2l4.3 2.8-4.3 2.8z" fill="currentColor" stroke="none" />
        </svg>
    )
}

/** "Preview" button of a comparison row with its popover. Hover/focus opens it on pointer devices, a click pins it, a tap toggles it. */
export default function ComparePreview(props: Props) {
    const { rowId, featureId } = props
    const variant = usePremiumVariant()
    const open = usePreviewState(rowId)
    const touchFirst = useIsTouchFirst()
    const timer = useDelayedAction()
    const popoverId = useId()
    const wrapperRef = useRef<HTMLSpanElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const anchorRef = useRef<HTMLElement | null>(null)
    useCloseOnUnmount(() => closePreview(rowId))

    function show(pinned: boolean) {
        timer.cancel()
        anchorRef.current = buttonRef.current?.closest('td, th') ?? buttonRef.current
        if (!open) trackPremiumPageEvent('preview opened', variant, { feature: featureId })
        setOpenPreview({ rowId, pinned })
    }

    function hideUnlessPinned() {
        if (!open?.pinned) closePreview(rowId)
    }

    function onClick() {
        if (open?.pinned || (touchFirst && open)) {
            timer.cancel()
            closePreview(rowId)
            return
        }
        show(true)
    }

    function onBlur(event: FocusEvent) {
        if (touchFirst || wrapperRef.current?.contains(event.relatedTarget as Node | null)) return
        timer.cancel()
        closePreview(rowId)
    }

    const hoverHandlers = touchFirst
        ? {}
        : {
              onMouseEnter: () => (open ? timer.cancel() : timer.schedule(() => show(false), OPEN_DELAY)),
              onMouseLeave: () => timer.schedule(hideUnlessPinned, CLOSE_DELAY)
          }

    return (
        <span ref={wrapperRef} className={styles.previewWrapper} onBlur={onBlur} {...hoverHandlers}>
            <button
                ref={buttonRef}
                type="button"
                className={styles.previewButton}
                aria-expanded={!!open}
                aria-controls={popoverId}
                onClick={onClick}
                onFocus={() => !touchFirst && !open && timer.schedule(() => show(false), OPEN_DELAY)}
            >
                <PlayCircleIcon />
                <span>Preview</span>
            </button>
            {open ? <PreviewPopover {...props} id={popoverId} anchorRef={anchorRef} wrapperRef={wrapperRef} buttonRef={buttonRef} /> : null}
        </span>
    )
}
