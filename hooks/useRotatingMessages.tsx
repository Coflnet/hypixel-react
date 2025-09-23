import { useEffect, useState } from 'react'

/**
 * Rotates through an array of messages while `active` is true.
 * Returns the current message or an empty string when not active or when messages are empty.
 */
export default function useRotatingMessages(active: boolean, messages: string[], intervalMs = 10000) {
    const [currentMessage, setCurrentMessage] = useState('')

    useEffect(() => {
        if (!active || !messages || messages.length === 0) {
            setCurrentMessage('')
            return
        }

        let index = 0
        setCurrentMessage(messages[0])

        const id = setInterval(() => {
            index = (index + 1) % messages.length
            setCurrentMessage(messages[index])
        }, intervalMs)

        return () => clearInterval(id)
    }, [active, messages, intervalMs])

    return currentMessage
}
