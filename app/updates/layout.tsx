import { ReactNode } from "react";
import { Container } from "react-bootstrap";
import NavBar from "../../components/NavBar/NavBar";

export default function UpdatesLayout({ children }: { children: ReactNode }) {
    return (
        <Container>
            <NavBar />
            {children}
        </Container>
    );
}
