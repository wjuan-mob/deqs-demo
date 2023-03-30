import React from 'react';

const items = [
  { id: 1, pair: 'A/B', name: 'Item 1' },
  { id: 2, pair: 'C/D', name: 'Item 2' },
  { id: 3, pair: 'A/B', name: 'Item 3' },
  { id: 4, pair: 'C/D', name: 'Item 4' },
  { id: 5, pair: 'E/F', name: 'Item 5' },
];

const itemBoxStyle = {
  border: '1px solid black',
  padding: '10px',
  margin: '10px',
};

const groupBy = (items, key) => {
  return items.reduce((result, item) => {
    const group = item[key];
    result[group] = result[group] || [];
    result[group].push(item);
    return result;
  }, {});
};

const ItemList = ({ items }) => {
  const groupedItems = groupBy(items, 'pair');

  return (
    <div>
      {Object.keys(groupedItems).map((group) => (
        <div key={group}>
          <h2>{group}</h2>
          {groupedItems[group].map((item) => (
            <div key={item.id} style={itemBoxStyle}>
              <h3>{item.name}</h3>
            </div>
          ))}
        </div>
      ))}
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
