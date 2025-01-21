import React, { useState } from 'react'
import styles from './ShowMoreText.module.css'

interface Props {
    content: JSX.Element
    initialHeight: number
    alwaysShowAll?: boolean
    allowShowLess?: boolean
    onShowChange?: (isExpanded: boolean) => void
    containerStyle?: React.CSSProperties
}

const ShowMoreText = (props: Props) => {
    const [isExpanded, setIsExpanded] = useState(false)

    const toggleExpand = () => {
        setIsExpanded(!isExpanded)
        props.onShowChange && props.onShowChange(!isExpanded)
    }

    if (props.alwaysShowAll) {
        return props.content
    }

    return (
        <div
            className={`${styles.textContainer} ${isExpanded ? styles.expanded : ''}`}
            style={{ height: isExpanded ? 'auto' : props.initialHeight, ...props.containerStyle }}
        >
            {props.content}
            <div className={styles.showMoreContainer} onClick={toggleExpand}>
                <span className={styles.showMoreText}>
                    {isExpanded && props.allowShowLess ? 'Show less' : null}
                    {!isExpanded ? 'Show more' : null}
                </span>
            </div>
        </div>
    )
}

export default ShowMoreText
