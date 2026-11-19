import { getApiLinkvertise } from '../../api/_generated/skyApi'

function answerAdLinkRequestWith(body: string, status: number) {
    const realFetch = globalThis.fetch
    cy.stub(globalThis, 'fetch').callsFake((input: RequestInfo | URL, init?: RequestInit) =>
        String(input).includes('/api/linkvertise')
            ? Promise.resolve(new Response(body, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } }))
            : realFetch(input, init)
    )
}

describe('Generated API client', () => {
    it('hands the plain text ad link back instead of failing to parse it as JSON', () => {
        const link = 'https://link-to.net/1161415/dynamic?r=aHR0cHM6Ly9za3kuY29mbG5ldC5jb20'
        answerAdLinkRequestWith(link, 200)

        cy.wrap(null)
            .then(() => getApiLinkvertise({ provider: 'linkvertise' }))
            .then(response => {
                expect(response.status).to.equal(200)
                expect(response.data).to.equal(link)
            })
    })

    it('hands a plain text error body back together with its status', () => {
        answerAdLinkRequestWith('no auth header passed', 401)

        cy.wrap(null)
            .then(() => getApiLinkvertise({ provider: 'lootlabs' }))
            .then(response => {
                expect(response.status).to.equal(401)
                expect(response.data).to.equal('no auth header passed')
            })
    })

    it('parses every response body through the helper that tolerates plain text', () => {
        // a regeneration whose parsing lines the postprocess script does not know leaves bare JSON.parse calls behind
        cy.readFile('api/_generated/skyApi.ts').then((source: string) => {
            expect(source.match(/JSON\.parse\(/g)).to.have.length(1)
        })
    })
})
