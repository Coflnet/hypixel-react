import React from 'react';
import { Route, Switch, Redirect } from "react-router-dom";
import { MatomoProvider, createInstance } from '@datapunt/matomo-tracker-react'
import cookie from 'cookie';

/**
 * Import all page components here
 */
import PlayerDetails from './pages/PlayerDetails/PlayerDetails';
import ItemDetails from './pages/ItemDetails/ItemDetails';
import AuctionDetails from './pages/AuctionDetails/AuctionDetails';
import { MainApp } from './components/MainApp/MainApp';

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
        <Route exact path="/" component={() => <Redirect to="/item/ASPECT_OF_THE_END" />} />
        <Route path='/player/:uuid' component={PlayerDetails} />
        <Route path='/item/:tag' component={ItemDetails} />
        <Route path='/auction/:auctionUUID' component={AuctionDetails} />
      </Switch>
    </MainApp>
  </MatomoProvider>
);