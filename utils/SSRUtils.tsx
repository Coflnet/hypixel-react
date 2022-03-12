export function isClientSideRendering() {
    return typeof window !== 'undefined'
}

export function getSSRElement(obj: any): JSX.Element {
    return (
        <ul>
            {Object.keys(obj).map(key => {
                if (!obj[key]) {
                    return null
                }
                if (key === 'iconUrl') {
                    return <img src={obj[key]} />
                }
                if (typeof obj[key] === 'object') {
                    return getSSRElement(obj[key])
                }
                return <li>{`${key}: ${obj[key].toString()}`}</li>
            })}
        </ul>
    )
}