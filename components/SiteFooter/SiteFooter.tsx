import CancelContractLink from '../Legal/CancelContractLink'
import styles from './SiteFooter.module.css'

/** the footer of every page; it carries the legally required link to cancel contracts */
export default function SiteFooter() {
    return (
        <footer className={styles.footer}>
            <CancelContractLink className={styles.link} />
        </footer>
    )
}
