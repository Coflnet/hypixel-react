import React, { Suspense } from 'react';
import { Route, Switch, Redirect } from "react-router-dom";
import { MatomoProvider, createInstance } from '@datapunt/matomo-tracker-react'
import cookie from 'cookie';
import { MainApp } from './components/MainApp/MainApp';
import { getLoadingElement } from './utils/LoadingUtils';

/**
 * Import all page components here
 */
const PlayerDetails = React.lazy(() => import('./pages/PlayerDetails/PlayerDetails'));
const ItemDetails = React.lazy(() => import('./pages/ItemDetails/ItemDetails'));
const AuctionDetails = React.lazy(() => import('./pages/AuctionDetails/AuctionDetails'));
const PaymentSuccess = React.lazy(() => import('./pages/PaymentSuccess/PaymentSuccess'))
const PaymentCancel = React.lazy(() => import('./pages/PaymentCancel/PaymentCancel'))

const matomoTrackingInstance = createInstance({
  urlBase: 'https://track.coflnet.com',
  siteId: 1,
  disabled: !isTrackingAllowed()
});

function isTrackingAllowed() {
  let cookies = cookie.parse(document.cookie);
  if (cookies.nonEssentialCookiesAllowed !== undefined) {
    return cookies.nonEssentialCookiesAllowed === "true";
  }
  return false;
}

/**
 * All routes go here.
 * Don't forget to import the components above after adding new route.
 */
export default (
  <MatomoProvider value={matomoTrackingInstance}>
    <MainApp>
      <Switch>
        <Suspense fallback={getLoadingElement()}>
          <Route path="/" component={() => <Redirect to="/item/ASPECT_OF_THE_END" />} />
          <Route path='/player/:uuid' component={PlayerDetails} />
          <Route path='/item/:tag' component={ItemDetails} />
          <Route path='/auction/:auctionUUID' component={AuctionDetails} />
          <Route path='/success' component={PaymentSuccess} />
          <Route path='/cancel' component={PaymentCancel} />
        </Suspense>
      </Switch>
    </MainApp>
  </MatomoProvider>
);