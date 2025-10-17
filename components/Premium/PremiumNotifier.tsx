 'use client'

 import React from 'react'
 import Link from 'next/link'
 import { Alert, Button } from 'react-bootstrap'
 import styles from './PremiumNotifier.module.css'
 import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'

 interface Props {
     title?: React.ReactNode
     children?: React.ReactNode
     messageFromApi?: string | null
     showCta?: boolean
     variant?: 'info' | 'warning' | 'danger' | 'primary' | 'success'
     onAfterLogin?: () => void
 }

 export default function PremiumNotifier({ title = 'Premium access required', children, messageFromApi, showCta = true, variant = 'info', onAfterLogin }: Props) {
     return (
         <div>
             <Alert variant={variant}>
                 <h3 className={styles.premiumTitle}>{title}</h3>
                 {children}
                 {messageFromApi ? <p className={styles.apiMessage}>{messageFromApi}</p> : null}
             </Alert>
             {showCta ? (
                 <div className={styles.ctaRow}>
                     <Link href="/premium" className="disableLinkStyle" rel="nofollow">
                         <Button variant="primary">See premium plans</Button>
                     </Link>
                     <GoogleSignIn onAfterLogin={onAfterLogin} />
                 </div>
             ) : null}
         </div>
     )
 }
