import React from 'react';

interface Props {
  onGotOutbidChange(value: boolean);
  onIsSoldChange(value: boolean);
}

function SubscribePlayerContent(props: Props) {
  return (
    <>
      <div className="player-forms">
        <h5>Notify me...</h5>
        <div className="input-data">
          <input type="checkbox" id="outbidCheckbox" onChange={(e) => props.onGotOutbidChange((e.target as HTMLInputElement).checked)} />
          <label htmlFor="outbidCheckbox">if player gets outbid</label>
        </div>
        <div className="input-data">
          <input type="checkbox" id="isSoldCheckbox" onChange={(e) => props.onIsSoldChange((e.target as HTMLInputElement).checked)} />
          <label htmlFor="isSoldCheckbox">if an auction of the player has ended</label>
        </div>
      </div>
    </>
  );
}

export default SubscribePlayerContent;
