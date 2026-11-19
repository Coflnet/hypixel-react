/** Honest explanation of where the numbers come from. */
export function TaskDataNote() {
    return (
        <section className="mt-4" aria-label="About the data">
            <h2 className="h5">Where do these numbers come from?</h2>
            <p>
                The coins/hour estimates are based on community-tracked activity of SkyCofl mod users: the mod records which items players collect while doing a
                task, and the items are valued with current Bazaar and Auction House prices. Each estimate is labelled with its source:
            </p>
            <ul>
                <li>
                    <strong>community data</strong> – measured from the drops of players who actually did the task recently.
                </li>
                <li>
                    <strong>estimated from drop rates</strong> – calculated from known drop rates and prices, because not enough players tracked the task yet.
                </li>
            </ul>
            <p className="text-muted small">
                Your own results depend on your gear, skills, perks and luck, and prices change constantly, so treat the numbers as a guide rather than a
                promise. &quot;Playing now&quot; counts mod users doing the task right now and the change over the last 20 minutes.
            </p>
        </section>
    )
}
