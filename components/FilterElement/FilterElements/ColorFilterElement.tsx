'use client'
import { useId } from 'react'
import Link from 'next/link'
import { colorModes, colorPatterns, previewColorFilter, rgbDistance } from './ColorFilterUtils'
import styles from './ColorFilterElement.module.css'

interface Props {
    onChange(value: string): void
    value: string
}

export function ColorFilterElement({ value, onChange }: Props) {
    const id = useId()
    const preview = previewColorFilter(value)
    const selectedMode = colorModes.find(option => option.mode === preview.mode)!
    const pickerColor = preview.target || preview.colors[0] || 'D07D07'

    return (
        <section className={styles.editor} aria-label="Color filter builder">
            <div className={styles.modes} role="group" aria-label="Color matching mode">
                {colorModes.map(option => (
                    <button type="button" key={option.mode} aria-pressed={option.mode === preview.mode} onClick={() => onChange(option.value)}>
                        {option.label}
                    </button>
                ))}
            </div>
            <p id={`${id}-help`} className={styles.help}>
                {selectedMode.help}
            </p>
            <label htmlFor={`${id}-value`}>Filter value</label>
            <div className={styles.valueRow}>
                <input
                    id={`${id}-value`}
                    className="form-control"
                    value={value}
                    spellCheck={false}
                    autoComplete="off"
                    aria-describedby={`${id}-help`}
                    aria-invalid={!!preview.error}
                    placeholder={selectedMode.value}
                    onChange={event => onChange(event.target.value)}
                />
                {['hex', 'distance'].includes(preview.mode) && (
                    <input
                        type="color"
                        aria-label="Choose target color"
                        value={`#${pickerColor}`}
                        onChange={event =>
                            onChange(event.target.value.slice(1).toUpperCase() + (preview.mode === 'distance' ? `-${preview.distance ?? 11}` : ''))
                        }
                    />
                )}
            </div>
            {preview.mode === 'distance' && !preview.error && (
                <div className={styles.distance}>
                    <label htmlFor={`${id}-distance`}>
                        Maximum RGB distance <strong>{preview.distance}</strong>
                    </label>
                    <input
                        id={`${id}-distance`}
                        type="range"
                        min={0}
                        max={765}
                        step={1}
                        value={preview.distance}
                        onChange={event => onChange(`${preview.target}-${event.target.value}`)}
                    />
                    <span>0 = exact color · 765 = every RGB color</span>
                </div>
            )}
            {preview.mode === 'pattern' && (
                <div className={styles.presets} role="group" aria-label="Pattern presets">
                    {colorPatterns.map(pattern => (
                        <button
                            type="button"
                            key={pattern.value}
                            onClick={() => onChange(pattern.value)}
                            aria-pressed={value.toUpperCase() === pattern.value.toUpperCase()}
                        >
                            {pattern.label}
                        </button>
                    ))}
                </div>
            )}
            {!preview.error && (
                <div className={styles.preview} aria-live="polite" aria-atomic="true">
                    <div className={styles.previewHeading}>
                        <strong>{preview.colors.length === 3 ? 'Three matching examples' : 'Matching colors'}</strong>
                        <span>{preview.colors.length === 1 ? 'Only one distinct color matches this value.' : 'Examples, not auction listings'}</span>
                    </div>
                    <div className={styles.swatches}>
                        {preview.colors.map(color => (
                            <div key={color} className={styles.sample} data-testid="matching-color" data-color={color}>
                                <div className={styles.swatch} style={{ backgroundColor: `#${color}` }} aria-hidden="true" />
                                <code>#{color}</code>
                                {preview.target && <small>RGB distance {rgbDistance(color, preview.target)}</small>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div className={styles.footer}>
                <p>Flip pattern and distance searches skip known default colors. Exact searches can include them.</p>
                <Link href="/wiki/color-filters">All color options and examples →</Link>
            </div>
        </section>
    )
}
