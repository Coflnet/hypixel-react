import { getGeneratedApiErrorText, isDefinitePlayerMiss, unwrapGeneratedApiArrayResponse, unwrapGeneratedApiPlayerNameResponse } from '../../utils/GeneratedApiResponseUtils'

describe('Generated API response utilities', () => {
    it('returns successful array responses', () => {
        expect(unwrapGeneratedApiArrayResponse({ status: 200, data: [1, 2] }, 'fallback')).to.deep.equal([1, 2])
    })

    it('throws the backend message instead of allowing map errors', () => {
        expect(() =>
            unwrapGeneratedApiArrayResponse(
                {
                    status: 400,
                    data: { slug: 'item_not_found', message: 'could not find item', trace: 'trace-id' }
                },
                'fallback'
            )
        ).to.throw('could not find item')
    })

    it('resolves the empty name response of a nameless player to an empty string instead of an object', () => {
        // the generated client turns the 200 empty body into {}, which React cannot render
        expect(unwrapGeneratedApiPlayerNameResponse({ status: 200, data: {} }, 'fallback')).to.equal('')
        expect(unwrapGeneratedApiPlayerNameResponse({ status: 200, data: 'Technoblade' }, 'fallback')).to.equal('Technoblade')
    })

    it('rejects failed name lookups with the backend message', () => {
        expect(() =>
            unwrapGeneratedApiPlayerNameResponse({ status: 400, data: { slug: 'invalid_uuid', message: 'not a valid minecraft account uuid.' } }, 'fallback')
        ).to.throw('not a valid minecraft account uuid.')
    })

    it('keeps names that the client parsed as non-strings and trims whitespace', () => {
        expect(unwrapGeneratedApiPlayerNameResponse({ status: 200, data: 12345 }, 'fallback')).to.equal('12345')
        expect(unwrapGeneratedApiPlayerNameResponse({ status: 200, data: true }, 'fallback')).to.equal('true')
        expect(unwrapGeneratedApiPlayerNameResponse({ status: 200, data: null }, 'fallback')).to.equal('')
        expect(unwrapGeneratedApiPlayerNameResponse({ status: 200, data: [] }, 'fallback')).to.equal('')
        expect(unwrapGeneratedApiPlayerNameResponse({ status: 200, data: '  Technoblade \n' }, 'fallback')).to.equal('Technoblade')
    })

    it('carries status and slug on the thrown name error and classifies definite misses', () => {
        const capture = (response: any) => {
            try {
                unwrapGeneratedApiPlayerNameResponse(response, 'fallback')
            } catch (e) {
                return e as any
            }
        }
        const invalid = capture({ status: 400, data: { slug: 'invalid_uuid', message: 'bad uuid' } })
        expect(invalid.status).to.equal(400)
        expect(invalid.slug).to.equal('invalid_uuid')
        expect(isDefinitePlayerMiss(invalid)).to.equal(true)
        const failed = capture({ status: 500, data: {} })
        expect(failed.status).to.equal(500)
        expect(failed.message).to.equal('fallback')
        expect(isDefinitePlayerMiss(failed)).to.equal(false)
        expect(isDefinitePlayerMiss(capture({ status: 404, data: {} }))).to.equal(true)
        expect(isDefinitePlayerMiss(capture({ status: 429, data: {} }))).to.equal(false)
        expect(isDefinitePlayerMiss(new TypeError('network'))).to.equal(false)
        expect(isDefinitePlayerMiss(undefined)).to.equal(false)
    })

    describe('error text of failed responses', () => {
        const FALLBACK = 'Could not create the notification target.'

        it('uses a string body as is', () => {
            expect(getGeneratedApiErrorText('plain text failure', FALLBACK)).to.equal('plain text failure')
        })

        it('uses the message of a slug/message/traceId body', () => {
            expect(getGeneratedApiErrorText({ slug: 'bad', message: 'target is invalid', traceId: 'abc' }, FALLBACK)).to.equal('target is invalid')
        })

        it('appends the validation message of a ProblemDetails body to the fallback', () => {
            const body = {
                errors: { Target: ['The Target field is required.'] },
                type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
                title: 'One or more validation errors occurred.',
                status: 400,
                traceId: '00-1947fcae6067508fb634e1873996690c-47d63c6cfbd28724-00'
            }
            expect(getGeneratedApiErrorText(body, FALLBACK)).to.equal('Could not create the notification target. The Target field is required.')
            expect(getGeneratedApiErrorText(body, FALLBACK)).not.to.contain('One or more validation errors occurred.')
        })

        it('joins several fields, de-duplicates and shortens long lists', () => {
            const some = { errors: { Target: ['The Target field is required.'], Name: ['The Name field is required.', 'The Target field is required.'] } }
            expect(getGeneratedApiErrorText(some, FALLBACK)).to.equal(`${FALLBACK} The Target field is required. The Name field is required.`)

            const many = { errors: { A: ['a1', 'a2'], B: ['b1', 'b2'], C: ['c1'] } }
            expect(getGeneratedApiErrorText(many, FALLBACK)).to.equal(`${FALLBACK} a1 a2 b1 (+2 more)`)
        })

        it('falls back for empty bodies and a title-only ProblemDetails', () => {
            expect(getGeneratedApiErrorText(undefined, FALLBACK)).to.equal(FALLBACK)
            expect(getGeneratedApiErrorText('', FALLBACK)).to.equal(FALLBACK)
            expect(getGeneratedApiErrorText({}, FALLBACK)).to.equal(FALLBACK)
            expect(getGeneratedApiErrorText({ title: 'One or more validation errors occurred.', errors: {} }, FALLBACK)).to.equal(FALLBACK)
        })
    })
})
