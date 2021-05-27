import React, { Suspense } from 'react';
import { Route, Switch, Redirect } from "react-router-dom";
import { MatomoProvider, createInstance } from '@datapunt/matomo-tracker-react'
import cookie from 'cookie';
import { MainApp } from './components/MainApp/MainApp';
import { getInitialLoadingElement } from './utils/LoadingUtils';

interface PreloadComponent {
  component: React.LazyExoticComponent<React.ComponentType<any>>,
  preload: Function
}

/**
 * Import all page components here
 */

const ReactLazyPreload = importStatement => {
  const Component: PreloadComponent = {
    component: React.lazy(importStatement),
    preload: importStatement
  };
  return Component;
};

const ItemDetails = ReactLazyPreload(() => import('./pages/ItemDetails/ItemDetails'));
ItemDetails.preload();

const PlayerDetails = ReactLazyPreload(() => import('./pages/PlayerDetails/PlayerDetails'));
const AuctionDetails = ReactLazyPreload(() => import('./pages/AuctionDetails/AuctionDetails'));
const Premium = ReactLazyPreload(() => import('./pages/Premium/Premium'));
const NotFound = ReactLazyPreload(() => import('./pages/NotFound/NotFound'));
const Subscriptions = ReactLazyPreload(() => import('./pages/Subscriptions/Subscriptions'));
const Feedback = ReactLazyPreload(() => import('./pages/Feedback/Feedback'));
const About = ReactLazyPreload(() => import('./pages/About/About'));
const Cancel = ReactLazyPreload(() => import('./pages/PaymentCancel/PaymentCancel'));
const Flipper = React.lazy(() => import('./pages/Flipper/Flipper'));

setTimeout(() => {
  PlayerDetails.preload();
  ItemDetails.preload();
  AuctionDetails.preload();
  Premium.preload();
  NotFound.preload();
  Subscriptions.preload();
  Feedback.preload();
  About.preload();
  Cancel.preload();
}, 2000);

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
          <Route path='/player/:uuid' component={PlayerDetails.component} />
          <Route path='/item/:tag' component={ItemDetails.component} />
          <Route path='/auction/:auctionUUID' component={AuctionDetails.component} />
          <Route path='/flipper' component={Flipper} />
          <Route path='/premium' component={Premium.component} />
          <Route path='/about' component={About.component} />
          <Route path='/subscriptions' component={Subscriptions.component} />
          <Route path='/feedback' component={Feedback.component} />
          <Route path='/cancel' component={Cancel.component} />
          <Route path='*' exact component={NotFound.component} />
        </Switch>
      </MainApp>
    </Suspense>
  </MatomoProvider>
);