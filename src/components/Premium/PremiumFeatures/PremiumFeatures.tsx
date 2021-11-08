import React from "react";
import './PremiumFeatures.css';
import { Table } from "react-bootstrap";
import { Link } from 'react-router-dom';


function PremiumFeatures() {

    let checkIcon = <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="lime" className="bi bi-check-circle-fill" viewBox="0 0 16 16">
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
    </svg>;

    let xIcon = <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" className="bi bi-x-circle-fill" viewBox="0 0 16 16">
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z" />
    </svg>;

    return (
        <div className="premium-features">
            <Table>
                <thead>
                    <tr>
                        <th className="feature-column-heading">
                            Feature
                        </th>
                        <th>
                            Free
                        </th>
                        <th>
                            Premium
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="feature-column">
                            Price history
                        </td>
                        <td>
                            {checkIcon}
                        </td>
                        <td>
                            {checkIcon}
                        </td>
                    </tr>
                    <tr>
                        <td className="feature-column">
                            Auction explorer
                        </td>
                        <td>
                            {checkIcon}
                        </td>
                        <td>
                            {checkIcon}
                        </td>
                    </tr>
                    <tr>
                        <td className="feature-column">
                            Player auction history
                        </td>
                        <td>
                            {checkIcon}
                        </td>
                        <td>
                            {checkIcon}
                        </td>
                    </tr>
                    <tr>
                        <td className="feature-column">
                            Display active auctions
                        </td>
                        <td>
                            {checkIcon}
                        </td>
                        <td>
                            {checkIcon}
                        </td>
                    </tr>
                    <tr>
                        <td className="feature-column">
                            Faster Flipper without delay
                        </td>
                        <td>
                            {xIcon}
                        </td>
                        <td>
                            {checkIcon}
                        </td>
                    </tr>
                    <tr>
                        <td className="feature-column">
                            Full access to flipper filters
                        </td>
                        <td>
                            {xIcon}
                        </td>
                        <td>
                            {checkIcon}
                        </td>
                    </tr>
                    <tr>
                        <td className="feature-column">
                            Up to 100 subscriptions
                        </td>
                        <td>
                            {xIcon}
                        </td>
                        <td>
                            {checkIcon}
                        </td>
                    </tr>
                    <tr>
                        <td className="feature-column">
                            Priority feature request
                        </td>
                        <td>
                            {xIcon}
                        </td>
                        <td>
                            {checkIcon}
                        </td>
                    </tr>
                    <tr>
                        <td className="feature-column">
                            List of low volume items (<Link to="/lowSupply">here</Link>)
                        </td>
                        <td>
                            {xIcon}
                        </td>
                        <td>
                            {checkIcon}
                        </td>
                    </tr>
                    <tr>
                        <td className="feature-column">
                            Discord role "Flipper" (on request)
                        </td>
                        <td>
                            {xIcon}
                        </td>
                        <td>
                            {checkIcon}
                        </td>
                    </tr>
                </tbody>
            </Table>
        </div>
    )
}

export default PremiumFeatures;
