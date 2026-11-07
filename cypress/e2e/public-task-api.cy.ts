import { getPublicTask, getPublicTasks } from '../../api/publicTaskApi'

type Answer = { body: string; status: number; contentType?: string }

function answerTaskRequestsWith(answer: Answer) {
    const realFetch = globalThis.fetch
    return cy.stub(globalThis, 'fetch').callsFake((input: RequestInfo | URL, init?: RequestInit) =>
        String(input).includes('/api/tasks')
            ? Promise.resolve(new Response(answer.body, { status: answer.status, headers: { 'content-type': answer.contentType ?? 'application/json' } }))
            : realFetch(input, init)
    )
}

function task(overrides: Record<string, unknown> = {}) {
    return { slug: 'mining', name: 'Mining', category: 'Mining', coinsPerHour: 1, ...overrides }
}

const unknownTaskBody = JSON.stringify({ slug: 'task_not_found', message: 'No task with slug nope', trace: null })

describe('Public task api', () => {
    it('reports an unknown slug as not found', () => {
        answerTaskRequestsWith({ body: unknownTaskBody, status: 404 })

        cy.wrap(null)
            .then(() => getPublicTask('nope'))
            .then(result => expect(result).to.deep.equal({ status: 'notFound' }))
    })

    it('treats a 404 without the task_not_found slug as an outage', () => {
        answerTaskRequestsWith({ body: '<html>404 page not found</html>', status: 404, contentType: 'text/html' })

        cy.wrap(null)
            .then(() => getPublicTask('mining'))
            .then(result => expect(result).to.deep.equal({ status: 'error' }))
    })

    it('treats a 404 with another error slug as an outage', () => {
        answerTaskRequestsWith({ body: JSON.stringify({ slug: 'route_not_found' }), status: 404 })

        cy.wrap(null)
            .then(() => getPublicTask('mining'))
            .then(result => expect(result).to.deep.equal({ status: 'error' }))
    })

    it('reports an unavailable estimator as an error', () => {
        answerTaskRequestsWith({ body: JSON.stringify({ slug: 'tasks_unavailable', message: 'x', trace: null }), status: 503 })

        cy.wrap(null)
            .then(() => getPublicTask('mining'))
            .then(result => expect(result).to.deep.equal({ status: 'error' }))
    })

    it('keeps only https wiki links', () => {
        const body = task({ wikiUrl: 'https://wiki.hypixel.net/Mining', whereWikiUrl: 'javascript:alert(1)' })
        answerTaskRequestsWith({ body: JSON.stringify(body), status: 200 })

        cy.wrap(null)
            .then(() => getPublicTask('mining'))
            .then(result => {
                expect(result.status).to.equal('ok')
                const loaded = result.status === 'ok' ? result.task : undefined
                expect(loaded?.wikiUrl).to.equal('https://wiki.hypixel.net/Mining')
                expect(loaded?.whereWikiUrl).to.equal(undefined)
            })
    })

    it('drops plain http wiki links', () => {
        answerTaskRequestsWith({ body: JSON.stringify(task({ wikiUrl: 'http://wiki.hypixel.net/Mining' })), status: 200 })

        cy.wrap(null)
            .then(() => getPublicTask('mining'))
            .then(result => expect(result.status === 'ok' && result.task.wikiUrl).to.equal(undefined))
    })

    it('encodes the slug and asks for a cached response with a timeout', () => {
        const fetchStub = answerTaskRequestsWith({ body: JSON.stringify(task()), status: 200 })

        cy.wrap(null)
            .then(() => getPublicTask('a/../b'))
            .then(() => {
                const [url, init] = fetchStub.firstCall.args as [string, RequestInit]
                expect(url).to.equal('https://sky.coflnet.com/api/tasks/a%2F..%2Fb')
                expect(init.next).to.deep.equal({ revalidate: 600 })
                expect(init.signal).to.be.instanceOf(AbortSignal)
            })
    })

    it('sorts the task list by coins per hour, best first', () => {
        const body = [task({ slug: 'low', coinsPerHour: 5 }), task({ slug: 'high', coinsPerHour: 50 }), task({ slug: 'mid', coinsPerHour: 20 })]
        answerTaskRequestsWith({ body: JSON.stringify(body), status: 200 })

        cy.wrap(null)
            .then(() => getPublicTasks())
            .then(tasks => expect(tasks?.map(t => t.slug)).to.deep.equal(['high', 'mid', 'low']))
    })

    it('returns no list when the estimator is unavailable', () => {
        answerTaskRequestsWith({ body: JSON.stringify({ slug: 'tasks_unavailable' }), status: 503 })

        cy.wrap(null)
            .then(() => getPublicTasks())
            .then(tasks => expect(tasks).to.equal(null))
    })

    it('returns no list when a 200 body is not JSON', () => {
        answerTaskRequestsWith({ body: '<html>maintenance</html>', status: 200, contentType: 'text/html' })

        cy.wrap(null)
            .then(() => getPublicTasks())
            .then(tasks => expect(tasks).to.equal(null))
    })

    it('reports a task whose 200 body is not JSON as an error', () => {
        answerTaskRequestsWith({ body: '<html>maintenance</html>', status: 200, contentType: 'text/html' })

        cy.wrap(null)
            .then(() => getPublicTask('mining'))
            .then(result => expect(result).to.deep.equal({ status: 'error' }))
    })

    it('drops list entries without a usable slug', () => {
        const body = [task({ slug: 'kept' }), task({ slug: undefined }), task({ slug: '' }), task({ slug: 42 }), task({ slug: null })]
        answerTaskRequestsWith({ body: JSON.stringify(body), status: 200 })

        cy.wrap(null)
            .then(() => getPublicTasks())
            .then(tasks => expect(tasks?.map(t => t.slug)).to.deep.equal(['kept']))
    })

    it('removes steps without text', () => {
        const steps = [{ number: 1, text: 'Warp to the mines' }, { number: 2, text: null }, { number: 3, text: '' }, { number: 4 }]
        answerTaskRequestsWith({ body: JSON.stringify(task({ steps })), status: 200 })

        cy.wrap(null)
            .then(() => getPublicTask('mining'))
            .then(result => expect(result.status === 'ok' && result.task.steps).to.deep.equal([{ number: 1, text: 'Warp to the mines' }]))
    })
})
