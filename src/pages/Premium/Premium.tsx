import React from 'react';
import { Container } from 'react-bootstrap';
import Premium from '../../components/Premium/Premium';
import './Premium.css'

interface Props {

}

function PremiumPage(props: Props) {

    return (
        <div className="premium-page">
            <Container>
                <Premium />
            </Container>
        </div>
    );
}

export default PremiumPage;