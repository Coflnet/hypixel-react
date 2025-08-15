import Link from 'next/link';
import { getDocs } from './lib';
import Search from '../../components/Search/Search';

export default async function WikiLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const docs = await getDocs();
    return (
        <div className="container mt-4">
            <div className="row">
                <Search />
                <div className="col-md-3">
                    <nav className="nav flex-column">
                        {docs.map(doc => (
                            <Link key={doc.slug} href={`/wiki/${doc.slug}`} legacyBehavior>
                                <a className="nav-link">{doc.title || doc.slug.replace(/-/g, ' ')}</a>
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="col-md-9">
                    {children}
                </div>
            </div>
        </div>
    );
}
