import React, { useEffect } from 'react';
import { Container } from 'react-bootstrap';
import Premium from '../../components/Premium/Premium';
import './Premium.css'

interface Props {

}

function PremiumPage(props: Props) {

    useEffect(() => {
        document.title = "Premium";
    })

    return (
        <div className="premium-page">
            <Container>
                <Premium />
            </Container>
        </div>
    );
}

export default PremiumPage;