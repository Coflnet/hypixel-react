export type ColorMode = 'hex' | 'rgb' | 'list' | 'distance' | 'pattern'

export const colorModes: { mode: ColorMode; label: string; value: string; help: string }[] = [
    { mode: 'hex', label: 'Exact hex', value: 'D07D07', help: 'Match one six-digit hex color. An optional # is accepted.' },
    { mode: 'rgb', label: 'Exact RGB', value: '208:125:7', help: 'The same exact match, written as red:green:blue. Each channel is 0–255.' },
    { mode: 'list', label: 'Color list', value: 'D07D07, F0DE09, AAAAAA', help: 'Match any listed hex color. Separate colors with commas or spaces.' },
    {
        mode: 'distance',
        label: 'RGB distance',
        value: 'F2DF11-11',
        help: 'Sum of absolute red, green and blue differences, up to the selected limit. This is not perceptual Delta E.'
    },
    {
        mode: 'pattern',
        label: 'Repeating pattern',
        value: 'pattern:ABCABC',
        help: 'Six positions. Repeated letters require equal hex digits; each underscore is independent. Different letters may share a digit.'
    }
]

export const colorPatterns = [
    { value: 'pattern:ABCABC', label: 'ABCABC · repeated block' },
    { value: 'pattern:AABBCC', label: 'AABBCC · digit pairs' },
    { value: '_E_E_E', label: '_E_E_E · alternating' },
    { value: 'pattern:ABABAB', label: 'ABABAB · repeated pair' },
    { value: 'pattern:AAAAAA', label: 'AAAAAA · one digit' },
    { value: '______', label: '______ · any color' }
]

const hex = /^#?[\da-f]{6}$/i
const toHex = (rgb: number[]) =>
    rgb
        .map(channel => channel.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()
const channels = (color: string) => [0, 2, 4].map(offset => parseInt(color.slice(offset, offset + 2), 16))
export const rgbDistance = (a: string, b: string) => channels(a).reduce((sum, channel, i) => sum + Math.abs(channel - channels(b)[i]), 0)

export function previewColorFilter(input: string): { mode: ColorMode; colors: string[]; error?: string; target?: string; distance?: number } {
    const value = input.trim()
    const mode: ColorMode =
        /^pattern:/i.test(value) || value.includes('_')
            ? 'pattern'
            : value.includes('-')
              ? 'distance'
              : value.includes(':')
                ? 'rgb'
                : /[,\s]/.test(value)
                  ? 'list'
                  : 'hex'
    const invalid = (error: string) => ({ mode, colors: [], error })
    if (mode === 'pattern') {
        const pattern = value.replace(/^pattern:/i, '').toUpperCase()
        if (!/^[A-Z_]{6}$/.test(pattern)) return invalid('Use six letters or underscores, for example pattern:ABCABC.')
        const colors = ['D07ACE', 'A1B2C3', '39FE80'].map(seed => {
            const assigned: Record<string, string> = {}
            return pattern
                .split('')
                .map((letter, i) => {
                    if (letter === '_') return seed[i]
                    return assigned[letter] ?? (assigned[letter] = seed[Object.keys(assigned).length])
                })
                .join('')
        })
        return { mode, colors }
    }
    if (mode === 'distance') {
        const match = /^#?([\da-f]{6})-(\d+)$/i.exec(value)
        if (!match || Number(match[2]) > 765) return invalid('Use HEX-distance with a whole decimal distance from 0 to 765, for example F2DF11-11.')
        const target = match[1].toUpperCase()
        const distance = Number(match[2])
        const colors = [target]
        // Generate a few guaranteed matches directly; never scan the RGB color space.
        for (let channel = 0; channel < 3 && colors.length < 3 && distance > 0; channel++) {
            for (const direction of [-1, 1]) {
                const rgb = channels(target)
                rgb[channel] += direction
                if (rgb[channel] >= 0 && rgb[channel] <= 255 && colors.length < 3) colors.push(toHex(rgb))
            }
        }
        return { mode, colors, target, distance }
    }
    if (mode === 'rgb') {
        if (!/^\d{1,3}:\d{1,3}:\d{1,3}$/.test(value) || value.split(':').some(v => Number(v) > 255))
            return invalid('Enter three channels from 0 to 255, separated by colons: 208:125:7.')
        return { mode, colors: [toHex(value.split(':').map(Number))] }
    }
    const values = value.split(/[,\s]+/).filter(Boolean)
    if (!values.length || values.some(v => !hex.test(v))) return invalid('Enter six-digit hex colors, for example D07D07. Use commas or spaces for a list.')
    return { mode, colors: Array.from(new Set(values.map(v => v.replace('#', '').toUpperCase()))).slice(0, 3) }
}
