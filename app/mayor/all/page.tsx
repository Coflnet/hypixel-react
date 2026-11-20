import { Metadata } from "next";
import { AllMayors } from "../../../components/Mayor/AllMayors";
import { Container } from "react-bootstrap";
import NavBar from "../../../components/NavBar/NavBar";
import Search from "../../../components/Search/Search";

export const metadata: Metadata = {
    title: "All Mayor Flips",
    description: "A list of all mayor flips from the last 5 years.",
};

export default function AllMayorPage() {
    return (
        <Container>
            <NavBar />
            <Search />
            <h1>All Mayors</h1>
            <hr />
            <AllMayors />
        </Container>
    );
}
