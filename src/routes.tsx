import React from 'react';
import { Route, Switch, Redirect } from "react-router-dom";

/**
 * Import all page components here
 */
import PlayerDetails from './pages/PlayerDetails/PlayerDetails';
import ItemDetails from './pages/ItemDetails/ItemDetails';

/**
 * All routes go here.
 * Don't forget to import the components above after adding new route.
 */
export default (
  <Switch>
    <Route exact path="/" component={() => <Redirect to="/item/Aspect of the End" />}/>
    <Route path='/player/:uuid' component={PlayerDetails}/>
    <Route path='/item/:itemName' component={ItemDetails}/>
  </Switch>
);