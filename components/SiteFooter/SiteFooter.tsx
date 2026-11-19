'use client'
import { CSSProperties } from 'react'
import CancelContractLink from '../Legal/CancelContractLink'
import { useBottomOverlayHeight } from '../../hooks/useBottomOverlayHeight'
import styles from './SiteFooter.module.css'

/**
 * The footer of every page; it carries the legally required link to cancel contracts. The cookie banner and the anchor ad
 * are fixed at the bottom of the window, so the footer leaves room for them and the link can be scrolled above them.
 */
export default function SiteFooter() {
    const covered = useBottomOverlayHeight()
    const style = { '--bottom-overlay-height': `${covered}px` } as CSSProperties
    return (
        <footer className={styles.footer} style={style} data-testid="site-footer">
            <CancelContractLink className={styles.link} />
        </footer>
    )
}
