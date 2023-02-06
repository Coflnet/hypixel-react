import { ChangeEvent, useState } from 'react';
import { ToggleButtonGroup, ToggleButton } from 'react-bootstrap';
import { Button, Card, Form, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../../api/ApiHelper';
import { CUSTOM_EVENTS } from '../../../api/ApiTypes.d';
import { numberWithThousandsSeperators } from '../../../utils/Formatter';
import { useCoflCoins } from '../../../utils/Hooks';
import { getPremiumType, PREMIUM_TYPES } from '../../../utils/PremiumTypeUtils';
import { CoflCoinsDisplay } from '../../CoflCoins/CoflCoinsDisplay';
import styles from './BuyPremium.module.css';

interface Props {
  activePremiumProduct: PremiumProduct;
  onNewActivePremiumProduct();
}

function BuyPremium(props: Props) {
  let [purchasePremiumType, setPurchasePremiumType] = useState<PremiumType>(
    PREMIUM_TYPES[0]
  );
  let [purchaseSuccessfulOption, setPurchaseSuccessfulDuration] =
    useState<PremiumTypeOption>();
  let [isPurchasing, setIsPurchasing] = useState(false);
  let [purchasePremiumOption, setPurchasePremiumOption] =
    useState<PremiumTypeOption>(PREMIUM_TYPES[0].options[0]);
  let [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  let coflCoins = useCoflCoins();

  function onDurationChange(event: ChangeEvent<HTMLSelectElement>) {
    let option = JSON.parse(event.target.value);
    setPurchasePremiumOption(option);
  }

  function onPremiumTypeChange(productId) {
    let selectedType = PREMIUM_TYPES.find(
      (type) => type.productId === productId
    );
    setPurchasePremiumType(selectedType);
    setPurchasePremiumOption(selectedType.options[0]);
  }

  function onPremiumBuy() {
    setShowConfirmationDialog(false);
    setIsPurchasing(true);

    api
      .purchaseWithCoflcoins(
        purchasePremiumOption.productId,
        purchasePremiumOption.value
      )
      .then(() => {
        document.dispatchEvent(
          new CustomEvent(CUSTOM_EVENTS.COFLCOIN_UPDATE, {
            detail: { coflCoins: coflCoins - getPurchasePrice() },
          })
        );
        setPurchaseSuccessfulDuration(purchasePremiumOption);
        setIsPurchasing(false);
        toast.success('Purchase successful');
        props.onNewActivePremiumProduct();
      });
  }

  function onPremiumBuyCancel() {
    setShowConfirmationDialog(false);
  }

  function getPurchasePrice() {
    return purchasePremiumOption.value * purchasePremiumOption.price;
  }

  function getDurationString(): string {
    let durationString = purchasePremiumType.durationString;
    let duration = +purchasePremiumOption.value;
    if (durationString && duration > 1) {
      durationString += 's';
    }
    return durationString;
  }

  let confirmationDialog = (
    <Modal
      show={showConfirmationDialog}
      onHide={() => {
        setShowConfirmationDialog(false);
      }}
    >
      <Modal.Header closeButton>
        <Modal.Title>Confirmation</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ul>
          <li>
            <span className={styles.label}>Type:</span>
            {purchasePremiumType.label}
          </li>
          <li>
            <span className={styles.label}>Duration:</span>
            {purchasePremiumOption.label} {getDurationString()}
          </li>
          <li>
            <span className={styles.label}>Price:</span>
            {numberWithThousandsSeperators(getPurchasePrice())} CoflCoins
          </li>
        </ul>
        <p>
          The time will be added to account. After you confirmed the purchase,
          it can't be canceled/moved to another account
        </p>
        {props.activePremiumProduct &&
        getPremiumType(props.activePremiumProduct).productId !==
          purchasePremiumType.productId ? (
          <div>
            <hr />
            <p style={{ color: 'yellow' }}>
              It seems you already have an active premium product. While the
              'better' premium is active, the other will get paused.
            </p>
          </div>
        ) : null}
        <hr />
        <Button variant='danger' onClick={onPremiumBuyCancel}>
          Cancel
        </Button>
        <Button
          variant='success'
          style={{ float: 'right' }}
          onClick={onPremiumBuy}
        >
          Confirm
        </Button>
      </Modal.Body>
    </Modal>
  );

  return (
    <>
      <Card className={styles.purchaseCard}>
        <Card.Header>
          <Card.Title>
            Buy premium for a certain duration with your CoflCoins. Your premium
            time starts shortly after your purchase.
          </Card.Title>
        </Card.Header>
        <div style={{ padding: '15px' }}>
          {!purchaseSuccessfulOption ? (
            <div>
              <div style={{ marginBottom: '15px' }}>
                <label className={styles.label}>Premium type:</label>
                <ToggleButtonGroup
                  style={{ width: '250px', display: 'inline' }}
                  type='radio'
                  name='options'
                  value={purchasePremiumType.productId}
                  onChange={onPremiumTypeChange}
                >
                  {PREMIUM_TYPES.map((premiumType) => (
                    <ToggleButton
                      value={premiumType.productId}
                      className='price-range-button'
                      size='sm'
                    >
                      {premiumType.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
                <div className={styles.coinBalance}>
                  <CoflCoinsDisplay />
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label className={styles.label}>Purchase Duration:</label>
                <Form.Control
                  as='select'
                  onChange={onDurationChange}
                  className={styles.dropdown}
                  key={purchasePremiumType.productId}
                  defaultValue={purchasePremiumOption.value}
                >
                  {purchasePremiumType.options.map((option) => {
                    return (
                      <option value={JSON.stringify(option)}>
                        {option.label}
                      </option>
                    );
                  })}
                </Form.Control>
                <span style={{ marginLeft: '20px' }}>
                  {getDurationString()}
                </span>
              </div>
              <div>
                <label className={styles.label}>Price:</label>
                <span style={{ fontWeight: 'bold' }}>
                  {numberWithThousandsSeperators(getPurchasePrice())} Coins
                </span>
              </div>
              {coflCoins > getPurchasePrice() ? (
                <div>
                  <label className={styles.label}>
                    Remaining after Purchase:
                  </label>
                  <span>
                    {numberWithThousandsSeperators(
                      coflCoins - getPurchasePrice()
                    )}{' '}
                    Coins
                  </span>
                </div>
              ) : null}
              <p style={{ marginTop: '20px' }}>
                This is a prepaid service. We won't automatically charge you
                after your premium time runs out!
              </p>
              <hr />
              <Button
                style={{ marginTop: '10px' }}
                variant='success'
                onClick={() => {
                  setShowConfirmationDialog(true);
                }}
                disabled={getPurchasePrice() > coflCoins || isPurchasing}
              >
                Purchase
              </Button>
              {getPurchasePrice() > coflCoins && !isPurchasing ? (
                <span>
                  <p>
                    <span style={{ color: 'red' }}>
                      You don't have enough CoflCoins to buy this.
                    </span>{' '}
                  </p>
                </span>
              ) : (
                ''
              )}
            </div>
          ) : (
            <p style={{ color: 'lime' }}>
              You successfully bought {purchaseSuccessfulOption.label}{' '}
              {getDurationString()} of {purchasePremiumType.label} for{' '}
              {numberWithThousandsSeperators(getPurchasePrice())} CoflCoins!
            </p>
          )}
        </div>
      </Card>
      {confirmationDialog}
    </>
  );
}

export default BuyPremium;
