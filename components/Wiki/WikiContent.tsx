'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { WikiPage } from '../../utils/WikiUtils'
import Search from '../Search/Search'
import styles from './WikiContent.module.css'

interface Props {
    page: WikiPage
    allPages: WikiPage[]
}

export default function WikiContent({ page, allPages }: Props) {
    const pathname = usePathname()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768)
        }
        
        checkMobile()
        window.addEventListener('resize', checkMobile)
        
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        // Close sidebar when route changes on mobile
        if (isMobile) {
            setIsSidebarOpen(false)
        }
    }, [pathname, isMobile])
    
    const isActive = (slug: string) => {
        if (slug === 'index') {
            return pathname === '/wiki'
        }
        return pathname === `/wiki/${slug}`
    }

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen)
    }

    const closeSidebar = () => {
        setIsSidebarOpen(false)
    }
    return (
        <>
            <div className={styles.breadcrumb}>
                <Search hideNavbar={false} />
                <Link href="/wiki/index">📚 Wiki</Link>
                {page.slug !== 'index' && (
                    <>
                        {' > '}
                        <span>{page.title}</span>
                    </>
                )}
            </div>
            
            <button 
                className={styles.sidebarToggle}
                onClick={toggleSidebar}
                aria-label="Toggle navigation"
            >
                📖 Navigation
            </button>
            
            {isMobile && isSidebarOpen && (
                <div 
                    className={`${styles.sidebarOverlay} ${isSidebarOpen ? 'show' : ''}`}
                    onClick={closeSidebar}
                />
            )}
            
            <div className={styles.wikiContainer}>
                <aside className={`${styles.sidebar} ${isMobile && isSidebarOpen ? styles.sidebarCollapsed : ''}`}>
                    <h3 className={styles.sidebarTitle}>
                        📖 Documentation
                        <button 
                            className={styles.sidebarCloseButton}
                            onClick={closeSidebar}
                            aria-label="Close navigation"
                        >
                            ×
                        </button>
                    </h3>
                    <nav>
                        <ul className={styles.sidebarNav}>
                            {allPages.map(navPage => (
                                <li key={navPage.slug} className={styles.sidebarNavItem}>
                                    <Link 
                                        href={navPage.slug === 'index' ? '/wiki' : `/wiki/${navPage.slug}`}
                                        className={`${styles.sidebarNavLink} ${isActive(navPage.slug) ? styles.active : ''}`}
                                        onClick={() => isMobile && closeSidebar()}
                                    >
                                        {navPage.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </aside>
                
                <main className={styles.content}>
                    <div 
                        className={styles.wikiContent}
                        dangerouslySetInnerHTML={{ __html: page.htmlContent }}
                    />
                </main>
            </div>
        </>
    )
}