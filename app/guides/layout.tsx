import { Metadata } from "next";
import { ReactNode } from "react";
import { Container } from "react-bootstrap";
import { getHeadMetadata } from "../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata("Flipping Guides");

export default function GuidesLayout({ children }: { children: ReactNode }) {
    return (
        <Container>
            <h1>Flipping Guides</h1>
            {children}
        </Container>
    );
}
