import styles from './AgreementDocumentList.module.css'

interface Props {
    documents: TermsStatus['documents']
    locale: 'en' | 'de'
}

export function readableLegalDocumentUrl(document: TermsStatus['documents'][number], compareVersion?: string) {
    const params = new URLSearchParams({ url: document.url, sha256: document.sha256 })
    if (compareVersion) params.set('compareVersion', compareVersion)
    return `/legal/document?${params}`
}

export default function AgreementDocumentList({ documents, locale }: Props) {
    const previousVersion = documents
        .filter(document => !document.changed && /^\d{4}-\d{2}-\d{2}$/.test(document.version))
        .map(document => document.version)
        .sort()
        .at(-1)

    return (
        <ul className={styles.documents}>
            {documents.map(document => (
                <li className={document.changed ? styles.changed : undefined} key={document.key}>
                    {document.changed ? <span className={styles.badge}>{locale === 'de' ? 'Geändert' : 'Changed'}</span> : null}
                    <a
                        href={readableLegalDocumentUrl(
                            document,
                            document.changed && previousVersion && previousVersion < document.version ? previousVersion : undefined
                        )}
                        target="_blank"
                        rel="noreferrer"
                    >
                        {document.title} ({document.version})
                    </a>
                </li>
            ))}
        </ul>
    )
}
