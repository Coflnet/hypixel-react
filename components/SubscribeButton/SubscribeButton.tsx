import { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { useMatomo } from '@datapunt/matomo-tracker-react';
import api from '../../api/ApiHelper';
import { Subscription, SubscriptionType } from '../../api/ApiTypes.d';
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn';
import { toast } from 'react-toastify';
import askForNotificationPermissons from '../../utils/NotificationPermisson';
import { NotificationsOutlined as NotificationIcon } from '@mui/icons-material';
import styles from './SubscribeButton.module.css';
import SubscribeItemContent from './SubscribeItemContent/SubscribeItemContent';
import { getLoadingElement } from '../../utils/LoadingUtils';
import SubscribePlayerContent from './SubscribePlayerContent/SubscribePlayerContent';
import SubscribeAuctionContent from './SubscribeAuctionContent/SubscribeAuctionContent';
import { useRouter } from 'next/router';
import { useWasAlreadyLoggedIn } from '../../utils/Hooks';
import { Edit as EditIcon } from '@mui/icons-material';

interface Props {
  topic: string;
  type: 'player' | 'item' | 'auction';
  buttonContent?: JSX.Element;
  isEditButton?: boolean;
  onAfterSubscribe?();
  prefill?: Subscription;
  popupTitle?: string;
  popupButtonText?: string;
  successMessage?: string;
}

const MAX_FILTERS = 5;

function SubscribeButton(props: Props) {
  let { trackEvent } = useMatomo();
  let router = useRouter();
  let [showDialog, setShowDialog] = useState(false);
  let [price, setPrice] = useState('');
  let [isPriceAbove, setIsPriceAbove] = useState(true);
  let [onlyInstantBuy, setOnlyInstantBuy] = useState(false);
  let [gotOutbid, setGotOutbid] = useState(false);
  let [isSold, setIsSold] = useState(false);
  let [isPlayerAuctionCreation, setIsPlayerAuctionCreation] = useState(false);
  let [isLoggedIn, setIsLoggedIn] = useState(false);
  let [itemFilter, setItemFilter] = useState<ItemFilter>(props.prefill?.filter);
  let wasAlreadyLoggedIn = useWasAlreadyLoggedIn();

  function onSubscribe() {
    trackEvent({ action: 'subscribed', category: 'subscriptions' });
    setShowDialog(false);
    // Set price to 0 per default for item subscriptions
    // This happens if a user only selects a filter and leaves the price field empty
    if (props.type === 'item' && !price) {
      price = '0';
    }
    api
      .subscribe(
        props.topic,
        getSubscriptionTypes(),
        price ? parseInt(price) : undefined,
        itemFilter
      )
      .then(() => {
        toast.success(
          props.successMessage || 'Notifier successfully created!',
          {
            onClick: () => {
              router.push({
                pathname: '/subscriptions',
              });
            },
          }
        );
        props.onAfterSubscribe();
      })
      .catch((error) => {
        toast.error(error.Message, {
          onClick: () => {
            router.push({
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
      if (isPlayerAuctionCreation) {
        types.push(SubscriptionType.PLAYER_CREATES_AUCTION);
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
    if (itemFilter && Object.keys(itemFilter).length > MAX_FILTERS) {
      return true;
    }
    if (props.type === 'item') {
      return itemFilter && Object.keys(itemFilter).length > 0
        ? false
        : price === undefined || price === '';
    }
    if (props.type === 'player') {
      return !gotOutbid && !isSold && !isPlayerAuctionCreation;
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
    <Modal
      show={showDialog}
      onHide={closeDialog}
      className={styles.subscribeDialog}
    >
      <Modal.Header closeButton>
        <Modal.Title>{props.popupTitle || 'Create a Notifier'}</Modal.Title>
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
                prefill={props.prefill}
              />
            ) : null}
            {props.type === 'player' ? (
              <SubscribePlayerContent
                onGotOutbidChange={setGotOutbid}
                onIsSoldChange={setIsSold}
                onIsPlayerAuctionCreation={setIsPlayerAuctionCreation}
                prefill={props.prefill}
              />
            ) : null}
            {props.type === 'auction' ? <SubscribeAuctionContent /> : null}
            <Button
              block
              onClick={onSubscribe}
              disabled={isNotifyDisabled()}
              className='notifyButton'
            >
              {props.popupButtonText || 'Notify me'}
            </Button>
            {itemFilter && Object.keys(itemFilter).length > MAX_FILTERS ? (
              <p style={{ color: 'red' }}>
                You currently can't use more than 5 filters for Notifiers
              </p>
            ) : null}
          </div>
        ) : (
          <p>To use notifiers, please login with Google: </p>
        )}
        <GoogleSignIn onAfterLogin={onLogin} />
        {wasAlreadyLoggedIn && !isLoggedIn ? getLoadingElement() : ''}
      </Modal.Body>
    </Modal>
  );

  return (
    <div className={styles.subscribeButton}>
      {dialog}
      {props.isEditButton ? (
        <div onClick={openDialog}>
          <EditIcon />
        </div>
      ) : (
        <Button style={{ width: 'max-content' }} onClick={openDialog}>
          <NotificationIcon />
          {props.buttonContent || ' Notify'}
        </Button>
      )}
    </div>
  );
}

export default SubscribeButton;
