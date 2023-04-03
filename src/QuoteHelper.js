
const currencyPriority = [
    { name: "GBP", tokenId: 0 },
    { name: "EUR", tokenId: 1 },
    { name: "USD", tokenId: 2 }
];

const compareTokens = (token1, token2, priority = currencyPriority) => {
    const token1Index = priority.indexOf(token1);
    const token2Index = priority.indexOf(token2);

    if (token1Index === -1 && token2Index === -1) {
        // If both tokens are not in currencyPriority, compare them alphabetically
        if (token1 < token2) {
            return [token1, token2];
        } else {
            return [token2, token1];
        }
    } else if (token1Index === -1) {
        // If token1 is not in currencyPriority, use token2 as the first token
        return [token2, token1];
    } else if (token2Index === -1) {
        // If token2 is not in currencyPriority, use token1 as the first token
        return [token1, token2];
    } else {
        // Both tokens are in currencyPriority, sort them based on index
        if (token1Index < token2Index) {
            return [token1, token2];
        } else {
            return [token2, token1];
        }
    }
};

const getTokenName = (token_id, priority = currencyPriority) => {
    const index = priority.findIndex(token => token.tokenId === token_id);
    return index !== -1 ? priority[index].name : token_id.toString();
  };


const getPairKey = (pair, priority = currencyPriority) => {
    const [firstToken, secondToken] = compareTokens(
        pair.base_token_id,
        pair.counter_token_id,
        priority
    );

    return `${getTokenName(firstToken, priority)}/${getTokenName(secondToken, priority)}`;
};

module.exports = {
    getPairKey,
    getTokenName,
    compareTokens,
};
