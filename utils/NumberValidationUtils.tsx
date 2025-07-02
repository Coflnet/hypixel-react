import { getNumberFromShortenString, numberWithThousandsSeparators } from './Formatter'

const getRangeErrorMessage = (lower: string, higher: string) =>
    'Please choose a value between ' + numberWithThousandsSeparators(parseInt(lower)) + ' and ' + numberWithThousandsSeparators(parseInt(higher)) + '. Options not available have not been listed on ah before (won\'t find anything).'
const INVALID_NUMBER_ERROR = 'This is not a valid number'
const INVALID_NUMBER_RANGE_ERROR = 'This is not a valid number range'
const RANGE_ORDER_ERROR = 'The range order is invalid'

function removeRangeSymbols(input: string) {
    if (input.startsWith('<') || input.startsWith('>')) {
        input = input.substring(1)
        if (input.startsWith('=')) {
            input = input.substring(1)
        }
    }
    return input
}

function getFilterNumber(number: string) {
    let numberRegexp = new RegExp( /^({{MIN_PROFIT}}\*|{{MAX_COST}}\*|{{MIN_VOLUME}}\*|{{MIN_PROFIT_PERCENT}}\*|)(\d*\.?\d+[kKmMbB]?)\|?$/)
    if (numberRegexp.test(number)) {
        if (number.includes('{'))
            return 1; // static 1 for variables
        return getNumberFromShortenString(number) as number
    }
    return null
}

function isNumberInRange(number: number, options: FilterOptions): boolean {
    if (options?.options?.length === 2) {
        let lowEnd = parseInt(options.options[0])
        let highEnd = parseInt(options.options[1])
        if (number < lowEnd || number > highEnd) {
            return false
        }
    }
    return true
}

export function validateFilterNumber(input: string, options: FilterOptions): [boolean, string?] {
    let number = getFilterNumber(input)
    if (number === null) {
        return [false, INVALID_NUMBER_ERROR]
    }
    if (!isNumberInRange(number, options)) {
        return [false, getRangeErrorMessage(options.options[0], options.options[1])]
    }
    return [true]
}

export function validateFilterRange(input: string, options: FilterOptions): [boolean, string?] {
    if (input.includes('|')) {
        let parts = input.split('|')
        for (let part of parts) {
            console.log('Validating part:', part)
            let [isValid, errorMessage] = validateFilterRange(part, options)
            if (!isValid) {
                console.error('Validation failed for part:', part, 'Error:', errorMessage)
                return [false, errorMessage]
            }
        }
        return [true]
    }
    if (!input.includes('-')) {
        input = removeRangeSymbols(input)
        let number = getFilterNumber(input)
        if (number === null) {
            return [false, INVALID_NUMBER_RANGE_ERROR]
        }
        if (!isNumberInRange(number, options)) {
            return [false, getRangeErrorMessage(options.options[0], options.options[1])]
        }
        return [true]
    }
    let [n1, n2] = input.split('-')
    let number1 = getFilterNumber(n1)
    let number2 = getFilterNumber(n2)
    if (number1 === null || number2 === null) {
        return [false, INVALID_NUMBER_RANGE_ERROR]
    }
    if (number1 > number2) {
        return [false, RANGE_ORDER_ERROR]
    }
    if (!isNumberInRange(number1, options) || !isNumberInRange(number2, options)) {
        return [false, getRangeErrorMessage(options.options[0], options.options[1])]
    }
    return [true]
}
