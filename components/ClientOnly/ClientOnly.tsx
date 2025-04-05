import { useEffect, useState } from 'react'

export default function ClientOnly({ children }) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    return mounted ? children : null
}
