import { getHeadElement } from '../utils/SSRUtils'

export default function Custom500() {
    return (
        <div className="page">
            {getHeadElement('Error')}
            <h1>500 - Server-side error occurred</h1>
        </div>
    )
}
