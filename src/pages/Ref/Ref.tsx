import React from 'react';
import { Container } from 'react-bootstrap';
import RefComponent from '../../components/Ref/Ref'
import './Ref.css'

interface Props {

}

function Startpage(props: Props) {

    return (
        <div className="ref-page">
            <Container>
                <RefComponent />
            </Container>
        </div>
    );
}

export default Startpage;