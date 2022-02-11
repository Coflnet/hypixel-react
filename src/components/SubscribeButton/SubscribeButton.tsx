import React, { useState } from 'react';
import './SubscribeButton.css';
import { Button, Modal } from 'react-bootstrap';
import { useMatomo } from '@datapunt/matomo-tracker-react';
import api from '../../api/ApiHelper';
import { SubscriptionType } from '../../api/ApiTypes.d';
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useHistory } from 'react-router-dom';
import askForNotificationPermissons from '../../utils/NotificationPermisson';
import { NotificationsOutlined as NotificationIcon } from '@material-ui/icons';
import SubscribePlayerContent from './SubscribePlayerContent/SubscribePlayerContent';
import SubscribeItemContent from './SubscribeItemContent/SubscribeItemContent';
import { wasAlreadyLoggedIn } from '../../utils/GoogleUtils';
import { getLoadingElement } from '../../utils/LoadingUtils';

interface Props {
  topic: string;
  type: 'player' | 'item' | 'auction';
  hideText?: boolean;
}

const MAX_FILTERS = 5;

let wasAlreadyLoggedIntoGoogle = wasAlreadyLoggedIn();

function SubscribeButton(props: Props) {
  let { trackEvent } = useMatomo();
  let history = useHistory();
  let [showDialog, setShowDialog] = useState(false);
  let [price, setPrice] = useState('');
  let [isPriceAbove, setIsPriceAbove] = useState(true);
  let [onlyInstantBuy, setOnlyInstantBuy] = useState(false);
  let [gotOutbid, setGotOutbid] = useState(false);
  let [isSold, setIsSold] = useState(false);
  let [isLoggedIn, setIsLoggedIn] = useState(false);
  let [itemFilter, setItemFilter] = useState<ItemFilter>();

  function onSubscribe() {
    trackEvent({ action: 'subscribed', category: 'subscriptions' });
    setShowDialog(false);
    api
      .subscribe(props.topic, getSubscriptionTypes(), price ? parseInt(price) : undefined, itemFilter)
      .then(() => {
        toast.success('Notifier successfully created!', {
          onClick: () => {
            history.push({
              pathname: '/subscriptions',
            });
          },
        });
      })
      .catch((error) => {
        toast.error(error.Message, {
          onClick: () => {
            history.push({
              pathname: '/subscriptions',
            });
          },
        });
      });
  }

  function getSubscriptionTypes(): SubscriptionType[] {
    let types: SubscriptionType[] = [];
    if (props.type === 'item') {
      if (isPriceAbove) {
        types.push(SubscriptionType.PRICE_HIGHER_THAN);
      }
      if (!isPriceAbove) {
        types.push(SubscriptionType.PRICE_LOWER_THAN);
      }
      if (onlyInstantBuy) {
        types.push(SubscriptionType.BIN);
      }
    }
    if (props.type === 'player') {
      if (gotOutbid) {
        types.push(SubscriptionType.OUTBID);
      }
      if (isSold) {
        types.push(SubscriptionType.SOLD);
      }
    }
    if (props.type === 'auction') {
      types.push(SubscriptionType.AUCTION);
    }
    return types;
  }

  function onLogin() {
    setIsLoggedIn(true);
    askForNotificationPermissons().then((token) => {
      api.setToken(token).then(() => {
        if (props.type === 'auction') {
          onSubscribe();
          setShowDialog(false);
        }
      });
    });
  }

  function isNotifyDisabled() {
    if(itemFilter && Object.keys(itemFilter).length > MAX_FILTERS){
      return true;
    }
    if (props.type === 'item') {
      return price === undefined || price === '';
    }
    if (props.type === 'player') {
      return !gotOutbid && !isSold;
    }
  }

  function closeDialog() {
    trackEvent({
      action: 'subscription dialog closed',
      category: 'subscriptions',
    });
    setShowDialog(false);
  }

  function openDialog() {
    trackEvent({
      action: 'subscription dialog opened',
      category: 'subscriptions',
    });
    setShowDialog(true);
  }

  let dialog = (
    <Modal show={showDialog} onHide={closeDialog} className="subscribe-dialog">
      <Modal.Header closeButton>
        <Modal.Title>Create a Notifier</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isLoggedIn ? (
          <div>
            {props.type === 'item' ? (
              <SubscribeItemContent
                itemTag={props.topic}
                onFilterChange={setItemFilter}
                onIsPriceAboveChange={setIsPriceAbove}
                onOnlyInstantBuyChange={setOnlyInstantBuy}
                onPriceChange={setPrice}
              />
            ) : (
              ''
            )}
            {props.type === 'player' ? <SubscribePlayerContent onGotOutbidChange={setGotOutbid} onIsSoldChange={setIsSold} /> : ''}
            <Button block onClick={onSubscribe} disabled={isNotifyDisabled()} className="notifyButton">
              Notify me
            </Button>
            {
              itemFilter && Object.keys(itemFilter).length > MAX_FILTERS ?
              <p style={{color: "red"}}>Because of performance issues, you can't use more than 5 filters for Notifiers</p> : null
            }
          </div>
        ) : (
          <p>To use notifiers, please login with Google: </p>
        )}
        {wasAlreadyLoggedIntoGoogle && !isLoggedIn ? getLoadingElement() : ''}
        <GoogleSignIn onAfterLogin={onLogin} />
      </Modal.Body>
    </Modal>
  );

  return (
    <div className="subscribe-button">
      {dialog}
      <Button style={{ width: 'max-content' }} onClick={openDialog}>
        <NotificationIcon /> {props.hideText ? '' : ' Notify'}
      </Button>
    </div>
  );
}

export default SubscribeButton;
