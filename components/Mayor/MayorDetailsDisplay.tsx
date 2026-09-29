"use client";
import { useState, useRef, useMemo } from "react";
import styles from "./MayorDetails.module.css";
import { Accordion, Card, Col, Row, ListGroup, Badge, Form, Button, InputGroup } from "react-bootstrap";
import { CoflnetSkyMayorModelsModelElectionPeriod } from "../../api/_generated/skyApi.schemas";
import { getMinecraftColorCodedElement } from "../../utils/Formatter";

type MayorElectionPeriodProps = {
    election: CoflnetSkyMayorModelsModelElectionPeriod;
    isSingleYear?: boolean;
}

function MayorElectionPeriod({ election, isSingleYear }: MayorElectionPeriodProps) {
    const initialCandidateKey = election.winner?.key ?? election.candidates?.[0]?.key ?? null;
    const [selectedCandidateKey, setSelectedCandidateKey] = useState<string | null>(initialCandidateKey);

    const selectedCandidate = election.candidates?.find(c => c.key === selectedCandidateKey) ?? election.winner;

    const renderContent = () => (
        <div className="py-2">
            <Row className="g-4">
                <Col md={4} xl={3}>
                    <h5 className="text-muted mb-3 border-bottom pb-2">Candidates</h5>
                    <ListGroup variant="flush">
                        {election.candidates?.map(candidate => (
                            <ListGroup.Item
                                key={candidate.key}
                                action
                                onClick={() => setSelectedCandidateKey(candidate.key ?? null)}
                                className={`px-3 py-2 mb-2 rounded border ${selectedCandidateKey === candidate.key ? 'bg-primary text-white border-primary shadow' : 'bg-transparent text-light border-secondary opacity-75'}`}
                                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                            >
                                <div className="d-flex justify-content-between align-items-center">
                                    <span>{candidate.name}</span>
                                    {election.winner?.key === candidate.key && (
                                        <Badge bg="success" className="ms-2">Winner</Badge>
                                    )}
                                </div>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </Col>
                <Col md={8} xl={9}>
                    <h5 className="text-info mb-3 border-bottom pb-2">
                        {selectedCandidateKey === election.winner?.key ? "Election Winner" : "Candidate Details"}
                    </h5>
                    {selectedCandidate ? (
                        <div className="mb-2">
                            <h3 className="mb-1">{selectedCandidate.name}</h3>

                            <h6 className="mt-4 mb-3 text-warning">Mayor Perks</h6>
                            <Row className="g-3">
                                {selectedCandidate.perks?.map(perk => (
                                    <Col sm={12} lg={6} key={perk.name}>
                                        <Card className="h-100 border-secondary" style={{ backgroundColor: '#2a2a2a' }}>
                                            <Card.Body className="p-3">
                                                <Card.Title className="text-info fw-bold mb-2 fs-6">{perk.name}</Card.Title>
                                                <Card.Text className="mb-0" style={{ fontSize: '0.95rem', lineHeight: '1.4', color: '#e0e0e0' }}>
                                                    {getMinecraftColorCodedElement(perk.description ?? '')}
                                                </Card.Text>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </div>
                    ) : (
                        <div className="p-4 text-center text-muted rounded border border-secondary" style={{ backgroundColor: '#2a2a2a' }}>
                            No candidate selected or data is missing.
                        </div>
                    )}
                </Col>
            </Row>
        </div>
    );

    if (isSingleYear) {
        return (
            <Card className="mb-3 border-secondary bg-transparent">
                <Card.Body>
                    {renderContent()}
                </Card.Body>
            </Card>
        );
    }

    return (
        <Accordion.Item eventKey={election.year.toString()} id={`year-item-${election.year}`} className="mb-3 rounded border border-secondary" style={{ overflow: 'hidden' }}>
            <Accordion.Header>
                Election in year {election.year}
            </Accordion.Header>
            <Accordion.Body>
                {renderContent()}
            </Accordion.Body>
        </Accordion.Item>
    )
}

type Props = {
    elections: CoflnetSkyMayorModelsModelElectionPeriod[];
    isSingleYear?: boolean;
    year?: string;
}

export function MayorDetailsDisplay({ elections, isSingleYear, year }: Props) {
    const defaultKey = elections.length > 0 ? elections[0].year.toString() : "0";
    const [activeKey, setActiveKey] = useState<string | string[]>(defaultKey);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const searchYear = searchInputRef.current?.value;
        if (searchYear) {
            setActiveKey(searchYear);
            const el = document.getElementById(`year-item-${searchYear}`);
            if (el) {
                const yOffset = -20;
                const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        }
    };

    const accordionItems = useMemo(() => {
        return elections.map((election) => (
            <MayorElectionPeriod key={election.year} election={election} />
        ));
    }, [elections]);

    return (
        <div>
            {!isSingleYear && (
                <div className="mb-4">
                    <Form onSubmit={handleSearch} className="d-flex align-items-center">
                        <span className="me-3 fw-bold text-light">Jump to Year:</span>
                        <InputGroup style={{ maxWidth: '300px' }}>
                            <Form.Control
                                type="number"
                                placeholder="e.g. 200"
                                ref={searchInputRef}
                                className="bg-dark text-light border-secondary"
                            />
                            <Button variant="primary" type="submit">Search</Button>
                        </InputGroup>
                    </Form>
                </div>
            )}

            {isSingleYear ? (
                <div>
                    {elections.map((election) => (
                        <MayorElectionPeriod key={election.year} election={election} isSingleYear={true} />
                    ))}
                </div>
            ) : (
                <Accordion activeKey={activeKey} onSelect={(k) => setActiveKey(k || "")} className={styles.customAccordion}>
                    {accordionItems}
                </Accordion>
            )}
        </div>
    );
}