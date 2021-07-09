import React from 'react';
import { Container } from 'react-bootstrap';
import RefComponent from '../../components/Ref/Ref'

interface Props {

}

function Ref(props: Props) {

    return (
        <div className="ref-page">
            <Container>
                <RefComponent />
            </Container>
        </div>
    );
}

export default Ref;