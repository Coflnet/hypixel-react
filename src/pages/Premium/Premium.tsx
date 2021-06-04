import React from 'react';
import Premium from '../../components/Premium/Premium';
import './Premium.css'

interface Props {

}

function PremiumPage(props: Props) {

    return (
        <div className="premium-page">
            <Premium />
        </div>
    );
}

export default PremiumPage;