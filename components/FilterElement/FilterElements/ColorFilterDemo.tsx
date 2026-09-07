'use client'
import { useState } from 'react'
import FilterElement from '../FilterElement'
import { FilterType } from '../FilterType'

export default function ColorFilterDemo() {
    const [value, setValue] = useState('pattern:ABCABC')
    const [valid, setValid] = useState(true)
    return (
        <div>
            <FilterElement
                options={{ name: 'Color', type: FilterType.EQUAL, options: [], description: null }}
                defaultValue="pattern:ABCABC"
                onFilterChange={filter => setValue(filter?.Color || '')}
                onIsValidChange={setValid}
            />
            <p aria-live="polite">
                <small>
                    {valid ? 'Ready to use' : 'Last valid value'}: <code data-testid="color-filter-value">Color={value}</code>
                </small>
            </p>
        </div>
    )
}
