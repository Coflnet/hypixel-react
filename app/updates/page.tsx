import Link from 'next/link'
import { Metadata } from 'next'
import { Container, Card, CardBody, CardTitle, CardText, Row, Col } from 'react-bootstrap'

export const metadata: Metadata = {
  title: 'Hypixel SkyBlock Updates & Dev-Log | SkyCofl Changelog',
  description:
    'Browse dev-log updates for SkyCofl — the Hypixel SkyBlock price tracker and flipping tool. Each month groups all changes shipped that month: new features, bug fixes, pricing improvements, and system changes. Check what was released recently or explore the full archive back to 2022.',
  keywords: [
    'skyblock updates',
    'dev-log',
    'changelog',
    'skycofl updates',
    'hypixel skyblock news',
    'price tracker updates',
    'feature releases',
    'bug fixes',
  ],
  openGraph: {
    title: 'Hypixel SkyBlock Updates & Dev-Log | SkyCofl Changelog',
    description:
      'Browse dev-log updates for SkyCofl. Each month groups all changes shipped that month: new features, bug fixes, pricing improvements, and system changes.',
  },
}

export default function UpdatesRootPage() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // Generate a list of recent months and archive years
  const recentMonths: { year: number; month: number; label: string }[] = []
  for (let i = 0; i < 6; i++) {
    let y = currentYear
    let m = currentMonth - i
    while (m < 1) {
      m += 12
      y -= 1
    }
    const monthName = new Date(y, m - 1).toLocaleString('en-US', { month: 'long' })
    recentMonths.push({ year: y, month: m, label: `${monthName} ${y}` })
  }

  const archiveYears: number[] = []
  for (let y = currentYear; y >= 2022; y--) {
    archiveYears.push(y)
  }

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><Link href="/">Home</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Updates</li>
            </ol>
          </nav>
          <Card>
            <CardBody>
              <CardTitle as="h1">SkyCofl Updates &amp; Dev-Log</CardTitle>
              <CardText className="lead">
                The SkyCofl team ships changes multiple times per week — new features, pricing algorithm improvements, bug fixes, security patches, and community-requested enhancements.
                This page groups them by month so you can easily see everything that was released in a given period.
              </CardText>
              <CardText>
                Browse any month&apos;s changes using the links below. The archive goes back to <strong>January 2022</strong>.
              </CardText>

              <hr />

              <CardTitle as="h2">Recent Months</CardTitle>
              <Row className="mb-4">
                {recentMonths.map(({ year, month, label }) => (
                  <Col key={`${year}-${month}`} xs={6} md={4} lg={2} className="mb-2">
                    <Link href={`/updates/${year}/${month}`} className="btn btn-outline-primary w-100">
                      {label}
                    </Link>
                  </Col>
                ))}
              </Row>

              <CardTitle as="h2">Archive by Year</CardTitle>
              <Row>
                {archiveYears.map((year) => {
                  const months = Array.from({ length: 12 }, (_, i) => {
                    const m = i + 1
                    const monthName = new Date(year, m - 1).toLocaleString('en-US', { month: 'short' })
                    const isFuture =
                      year > currentYear || (year === currentYear && m > currentMonth)
                    return { month: m, label: monthName, disabled: isFuture }
                  })
                  return (
                    <Col key={year} xs={12} md={6} lg={4} className="mb-4">
                      <Card className="h-100">
                        <CardBody>
                          <CardTitle as="h3">{year}</CardTitle>
                          <div className="d-flex flex-wrap gap-1">
                            {months.map(({ month, label, disabled }) =>
                              disabled ? (
                                <span
                                  key={month}
                                  className="btn btn-sm btn-outline-secondary disabled opacity-50"
                                  style={{ pointerEvents: 'none' }}
                                >
                                  {label}
                                </span>
                              ) : (
                                <Link
                                  key={month}
                                  href={`/updates/${year}/${month}`}
                                  className="btn btn-sm btn-outline-primary"
                                >
                                  {label}
                                </Link>
                              )
                            )}
                          </div>
                        </CardBody>
                      </Card>
                    </Col>
                  )
                })}
              </Row>

              <hr className="mt-4" />

              <CardTitle as="h2">About the Updates Page</CardTitle>
              <CardText>
                Updates are shipped throughout each month — often multiple times per week. This page collects them by month so you can review everything that landed in a given period.
                Entries are listed in reverse chronological order within each month. Entries marked with <strong>➡️</strong> are user-facing changes such as:
              </CardText>
              <ul>
                <li><strong>New features</strong> — tools, commands, and pages added to the website or mod</li>
                <li><strong>Bug fixes</strong> — corrections to pricing, filtering, tracking, and display issues</li>
                <li><strong>Pricing improvements</strong> — updates to valuation algorithms, median calculations, and item data</li>
                <li><strong>Security patches</strong> — infrastructure and authentication hardening</li>
                <li><strong>Community requests</strong> — features suggested by users via <code>/cofl report</code> or Discord</li>
              </ul>
              <CardText>
                For the latest changes, check the <Link href={`/updates/${currentYear}/${currentMonth}`}>current month</Link>.
                You can also view the <Link href="https://github.com/Coflnet/SkyblockMod/releases" target="_blank" rel="noopener noreferrer">GitHub releases</Link> for mod-only changes.
              </CardText>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
