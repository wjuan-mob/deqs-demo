import React from 'react';
import { Tooltip } from 'react-tooltip';

const items = [
    { pair: 'A/B', quantity: '0M', bid: 1.12, ask: 1.13 },
    { pair: 'A/B', quantity: '1M', bid: 1.11, ask: 1.14 },
    { pair: 'A/B', quantity: '2M', bid: 1.10, ask: 1.15 },
    { pair: 'A/B', quantity: '5M', bid: 1.08, ask: 1.17 },
    { pair: 'A/B', quantity: '10M', bid: 1.05, ask: 1.20 },
    { pair: 'C/D', quantity: '0M', bid: 2.12, ask: 2.13 },
    { pair: 'C/D', quantity: '1M', bid: 2.11, ask: 2.14 },
    { pair: 'C/D', quantity: '2M', bid: 2.10, ask: 2.15 },
    { pair: 'C/D', quantity: '5M', bid: 2.08, ask: 2.17 },
    { pair: 'C/D', quantity: '10M', bid: 2.05, ask: 2.20 },
    { pair: 'E/F', quantity: '0M', bid: 3.12, ask: 3.13 },
    { pair: 'E/F', quantity: '1M', bid: 3.11, ask: 3.14 },
    { pair: 'E/F', quantity: '2M', bid: 3.10, ask: 3.15 },
    { pair: 'E/F', quantity: '5M', bid: 3.08, ask: 3.17 },
    { pair: 'E/F', quantity: '10M', bid: 3.05, ask: 3.20 },
    { pair: 'G/H', quantity: '0M', bid: 4.12, ask: 4.13 },
    { pair: 'G/H', quantity: '1M', bid: 4.11, ask: 4.14 },
    { pair: 'G/H', quantity: '2M', bid: 4.10, ask: 4.15 },
    { pair: 'G/H', quantity: '5M', bid: 4.08, ask: 4.17 },
    { pair: 'G/H', quantity: '10M', bid: 4.05, ask: 4.20 },
    { pair: 'I/J', quantity: '0M', bid: 5.12, ask: 5.13 },
    { pair: 'I/J', quantity: '1M', bid: 5.11, ask: 5.14 },
    { pair: 'I/J', quantity: '2M', bid: 5.10, ask: 5.15 },
    { pair: 'I/J', quantity: '5M', bid: 5.08, ask: 5.17 },
    { pair: 'I/J', quantity: '10M', bid: 5.05, ask: 5.20 },
];


const boxesWithScrollbarStyle = {
    border: '1px solid black',
    padding: '10px',
    margin: '10px',
    borderRadius: '10px',
    overflow: 'hidden', // hide overflowing text
    textOverflow: 'ellipsis', // add ellipsis to truncated text
    whiteSpace: 'nowrap', // prevent text from wrapping
    maxWidth: '100%', // set a maximum width to avoid expanding beyond the box
};

const truncatedStyle = {
    border: '1px solid black',
    padding: '10px',
    margin: '10px',
    borderRadius: '10px',
    overflow: 'hidden', // hide overflowing text
    textOverflow: 'ellipsis', // add ellipsis to truncated text
    whiteSpace: 'nowrap', // prevent text from wrapping
    maxWidth: '100%', // set a maximum width to avoid expanding beyond the box
};



const groupHeaderStyle = {
    marginBottom: '10px',
};

const groupBy = (items, key) => {
    return items.reduce((result, item) => {
        const group = item[key];
        result[group] = result[group] || [];
        result[group].push(item);
        return result;
    }, {});
};
const groupBoxStyle = {
    border: '1px solid black',
    borderRadius: '10px',
    padding: '10px',
    marginBottom: '10px',
    height: '300px', // set a fixed height for the grouping box
};

const groupWrapperStyle = {
    width: '100%',
    margin: '0',
};

const smallTextStyle = {
    fontSize: '0.8em',
};

const renderItemName = (name) => {
    const MAX_LENGTH = 5;
    const displayName = name.length > MAX_LENGTH ? `${name.slice(0, MAX_LENGTH)}...` : name;
    return (
        <div>
            <Tooltip id={`tooltip-${name}`} place="bottom" effect="solid">
                {name}
            </Tooltip>
            <div data-tip data-for={`tooltip-${name}`}>
                {displayName}
            </div>
        </div>
    );
};

const ItemList = ({ items }) => {
    const groupedItems = groupBy(items, 'pair');
  
    return (
      <div className="item-list" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gridGap: '10px',
          }}
        >
          {Object.keys(groupedItems).map((group) => (
            <div key={group} className="item-group">
              <h2>{group}</h2>
              {groupedItems[group].map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    ...truncatedStyle,
                    ...(index !== 0 && smallTextStyle),
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px',
                    backgroundColor: 'white'
                  }}
                >
                  <div
                    style={{
                      backgroundColor: 'rgba(120, 220, 140, 0.8)',
                      padding: '10px',
                      borderRadius: '5px',
                    }}
                  >
                    <h3>Bid</h3>
                    <div>{renderItemName(item.bid)}</div>
                  </div>
                  <div style={{ fontSize: '24px', margin: '0 10px' }}>{item.quantity}</div>
                  <div
                    style={{
                      backgroundColor: 'rgba(220, 120, 140, 0.8)',
                      padding: '10px',
                      borderRadius: '5px',
                    }}
                  >
                    <h3>Ask</h3>
                    <div>{renderItemName(item.ask)}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };
    




const App = () => {
    return (
        <div>
            <ItemList items={items} />
        </div>
    );
};

export default App;
