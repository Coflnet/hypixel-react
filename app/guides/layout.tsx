import { Metadata } from "next";
import { ReactNode } from "react";
import { Container } from "react-bootstrap";
import { getHeadMetadata } from "../../utils/SSRUtils";
import Search from "../../components/Search/Search";
import NavBar from "../../components/NavBar/NavBar";

export const metadata: Metadata = getHeadMetadata("Flipping Guides");

export default function GuidesLayout({ children }: { children: ReactNode }) {
    return (
        <Container>
            <NavBar />
            <Search />
            <h1>Flipping Guides</h1>
            {children}
        </Container>
    );
}
