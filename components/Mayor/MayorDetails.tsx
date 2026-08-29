"use client";
import { useGetApiMayor, useGetApiMayorYear } from "../../api/_generated/skyApi";
import styles from "./MayorDetails.module.css";
import Link from "next/link";
import { Accordion, Card, Col, Container, Row } from "react-bootstrap";
import { CoflnetSkyMayorModelsModelElectionPeriod } from "../../api/_generated/skyApi.schemas";

type Props = {
    year?: string;
}

function MayorElectionPeriod({ election }: { election: CoflnetSkyMayorModelsModelElectionPeriod }) {
    return (
        <Card className="mb-3">
            <Card.Header>
                <Accordion.Header>
                    Election in year {election.year}
                </Accordion.Header>
            </Card.Header>
            <Accordion.Body>
                <Card.Body>
                    <Row>
                        <Col md={6}>
                            <h5>Candidates</h5>
                            <ul>
                                {election.candidates?.map(candidate => (
                                    <li key={candidate.key}>{candidate.name}</li>
                                ))}
                            </ul>
                        </Col>
                        <Col md={6}>
                            <h5>Winner</h5>
                            {election.winner ? (
                                <div>
                                    <p>Name: {election.winner.name}</p>
                                    <p>Key: {election.winner.key}</p>
                                    <h6>Perks:</h6>
                                    <ul>
                                        {election.winner.perks?.map(perk => (
                                            <li key={perk.name}>{perk.name}: {perk.description}</li>
                                        ))}
                                    </ul>
                                </div>
                            ) : <p>No winner declared.</p>}
                        </Col>
                    </Row>
                </Card.Body>
            </Accordion.Body>
        </Card>
    )
}


export default function MayorDetails({ year }: Props) {
    const { data: mayorData, isLoading: isMayorLoading, error: mayorError } = useGetApiMayor(undefined,
        {
            query: {
                enabled: !year,
            },
        }
    );

    const { data: mayorYearData, isLoading: isMayorYearLoading, error: mayorYearError } = useGetApiMayorYear(
        parseInt(year || new Date().getFullYear().toString(), 10),
        {
            query: {
                enabled: !!year,
            },
        }
    );

    const isLoading = isMayorLoading || isMayorYearLoading;
    const error = mayorError || mayorYearError;
    const data = year ? mayorYearData : mayorData;

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error loading mayor data</div>;
    }

    const elections = data?.data ? (Array.isArray(data.data) ? data.data : [data.data]) : [];
    const years = Array.from(new Set(elections.map(e => e.year)));

    return (
        <Container className={styles.container}>
            <h1>Mayor Details</h1>
            {year && <h2>Year: {year}</h2>}

            <div className={styles.yearLinks}>
                {years.map(y => (
                    <Link key={y} href={`/mayor/${y}`}>
                        {y}
                    </Link>
                ))}
            </div>

            <Accordion defaultActiveKey="0">
                {elections.map((election, index) => (
                    <MayorElectionPeriod key={index} election={election} />
                ))}
            </Accordion>
        </Container>
    );
}
