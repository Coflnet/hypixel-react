import Link from 'next/link'
import type { ToolLandingSeoContent } from './toolLandingSeoContent'

interface Props {
    content: ToolLandingSeoContent
}

export function ToolLandingSeo({ content }: Props) {
    return (
        <section className="mt-4" aria-label="Tool guide">
            {content.intro.map((paragraph, index) => (
                <p key={`intro-${index}`}>{paragraph}</p>
            ))}

            {content.sections.map((section, sectionIndex) => (
                <section key={`${section.title}-${sectionIndex}`} className="mt-4">
                    <h2>{section.title}</h2>
                    {section.paragraphs?.map((paragraph, paragraphIndex) => (
                        <p key={`${section.title}-paragraph-${paragraphIndex}`}>{paragraph}</p>
                    ))}
                    {section.bullets?.length ? (
                        <ul>
                            {section.bullets.map((bullet, bulletIndex) => (
                                <li key={`${section.title}-bullet-${bulletIndex}`}>{bullet}</li>
                            ))}
                        </ul>
                    ) : null}
                </section>
            ))}

            {content.faqs?.length ? (
                <section className="mt-4">
                    <h2>Frequently asked questions</h2>
                    <dl>
                        {content.faqs.map((faq, faqIndex) => (
                            <div key={`${faq.question}-${faqIndex}`} className="mb-3">
                                <dt>
                                    <strong>{faq.question}</strong>
                                </dt>
                                <dd>{faq.answer}</dd>
                            </div>
                        ))}
                    </dl>
                </section>
            ) : null}

            <section className="mt-4">
                <h2>Related guides and tools</h2>
                <ul>
                    {content.relatedLinks.map((link) => (
                        <li key={link.href}>
                            <Link href={link.href}>{link.label}</Link> - {link.description}
                        </li>
                    ))}
                </ul>
            </section>
        </section>
    )
}