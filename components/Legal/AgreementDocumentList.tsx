import styles from './AgreementDocumentList.module.css'

interface Props {
    documents: TermsStatus['documents']
    locale: 'en' | 'de'
}

export function readableLegalDocumentUrl(document: TermsStatus['documents'][number]) {
    const params = new URLSearchParams({ url: document.url, sha256: document.sha256 })
    return `/legal/document?${params}`
}

export default function AgreementDocumentList({ documents, locale }: Props) {
    return (
        <ul className={styles.documents}>
            {documents.map(document => (
                <li className={document.changed ? styles.changed : undefined} key={document.key}>
                    {document.changed ? <span className={styles.badge}>{locale === 'de' ? 'Geändert' : 'Changed'}</span> : null}
                    <a href={readableLegalDocumentUrl(document)} target="_blank" rel="noreferrer">
                        {document.title} ({document.version})
                    </a>
                </li>
            ))}
        </ul>
    )
}
