import React, { useState } from 'react';

function FlipRestrictionList() {

    let [isAddNewFlipperExtended, setIsNewFlipperExtended] = useState(false);
    let [restrictions, setRestrictions] = useState<FlipRestriction[]>([])

    function getRestrictionElement(restriction: FlipRestriction) {
        return (
            <div>

            </div>
        )
    }

    return (
        <div className="flip-restriction-list">
            {
                isAddNewFlipperExtended ? null : (
                    <div>
                    </div>
                )
            }
            {
                restrictions.forEach(restriction => {
                    
                })
            }
        </div>
    );
}

export default FlipRestrictionList;