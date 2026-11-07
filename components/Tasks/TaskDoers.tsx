import { formatCount, formatDoersChange } from './taskUtils'

interface Props {
    currentDoers: number
    doersChange20m: number
}

function getChangeClass(change: number): string {
    if (change > 0) {
        return 'text-success'
    }
    return change < 0 ? 'text-danger' : 'text-muted'
}

/** Players doing the task right now plus the change over the last 20 minutes. */
export function TaskDoers({ currentDoers, doersChange20m }: Props) {
    return (
        <span>
            {formatCount(currentDoers)}{' '}
            <small className={getChangeClass(doersChange20m)} title="Change over the last 20 minutes">
                ({formatDoersChange(doersChange20m)} / 20 min)
            </small>
        </span>
    )
}
