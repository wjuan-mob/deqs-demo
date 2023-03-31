import React from 'react';

const items = [
  { id: 1, pair: 'A/B', name: 'Item 1 sadsfsafadsfsadfsfdsafzsdfsfdasfafwawfefawfewafawfewawafeafwafewfaefwafewafaefwfeaewfawfewefafewaefawefwaefawefwaefafeaewfwa' },
  { id: 2, pair: 'C/D', name: 'Item 2' },
  { id: 3, pair: 'A/B', name: 'Item 3' },
  { id: 4, pair: 'C/D', name: 'Item 4' },
  { id: 5, pair: 'E/F', name: 'Item 5' },
];

const itemBoxStyle = {
    border: '1px solid black',
    padding: '10px',
    margin: '10px',
    borderRadius: '10px',
    overflow: 'auto', // add this to enable scrollbar for long items
    maxHeight: '250px', // set a maximum height for the item box  
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
  
  const ItemList = ({ items }) => {
    const groupedItems = groupBy(items, 'pair');
  
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gridGap: '10px',
      }}>
        {Object.keys(groupedItems).map((group) => (
          <div key={group} style={groupBoxStyle}>
            <h2>{group}</h2>
            <div style={groupWrapperStyle}>
              {groupedItems[group].map((item) => (
                <div key={item.id} style={itemBoxStyle}>
                  <h3>{item.name}</h3>
                </div>
              ))}
            </div>
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
