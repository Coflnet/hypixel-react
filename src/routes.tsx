import React, { Suspense } from 'react';
import { Route, Switch, Redirect } from "react-router-dom";
import { MatomoProvider, createInstance } from '@datapunt/matomo-tracker-react'
import cookie from 'cookie';
import { MainApp } from './components/MainApp/MainApp';
import { getInitialLoadingElement } from './utils/LoadingUtils';

/**
 * Import all page components here
 */
const playerDetailsPromise = import('./pages/PlayerDetails/PlayerDetails');
const PlayerDetails = React.lazy(() => playerDetailsPromise);

const itemDetailsPromise = import('./pages/ItemDetails/ItemDetails');
const ItemDetails = React.lazy(() => itemDetailsPromise);

const auctionDetailsPromise = import('./pages/AuctionDetails/AuctionDetails');
const AuctionDetails = React.lazy(() => auctionDetailsPromise);

const premiumPromise = import('./pages/Premium/Premium');
const Premium = React.lazy(() => premiumPromise);

const notFoundPromise = import('./pages/NotFound/NotFound');
const NotFound = React.lazy(() => notFoundPromise);

const subscriptionPromise = import('./pages/Subscriptions/Subscriptions');
const Subscriptions = React.lazy(() => subscriptionPromise);

const feedbackPromise = import('./pages/Feedback/Feedback');
const Feedback = React.lazy(() => feedbackPromise);

const aboutPromise = import('./pages/About/About');
const About = React.lazy(() => aboutPromise);

const cancelPromise = import('./pages/PaymentCancel/PaymentCancel');
const Cancel = React.lazy(() => cancelPromise);

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
    <Suspense fallback={getInitialLoadingElement()}>
      <MainApp>
        <Switch>
          <Route exact path="/" component={() => <Redirect to="/item/ASPECT_OF_THE_END" />} />
          <Route path='/player/:uuid' component={PlayerDetails} />
          <Route path='/item/:tag' component={ItemDetails} />
          <Route path='/auction/:auctionUUID' component={AuctionDetails} />
          <Route path='/premium' component={Premium} />
          <Route path='/about' component={About} />
          <Route path='/subscriptions' component={Subscriptions} />
          <Route path='/feedback' component={Feedback} />
          <Route path='/cancel' component={Cancel} />
          <Route path='*' exact component={NotFound} />
        </Switch>
      </MainApp>
    </Suspense>
  </MatomoProvider>
);