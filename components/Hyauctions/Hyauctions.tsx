import Link from 'next/link';
import React from 'react';

function HyAuctions() {
    return (
        <>
            <h2>Coflnet</h2>
            <hr />
            <p>
                We provide a HyAuctions alternative. That includes player and item history but also bazaar history, notifications,{' '}
                <Link href={'/crafts'}>crafts</Link> & <Link href={'/kat'}>Kat Flips</Link> as well as an <Link href={'/flipper'}>advanced AH flipper</Link>.
            </p>
            <p>Just try using the search bar above (it actually works).</p>
        </>
    )
}

export default HyAuctions
