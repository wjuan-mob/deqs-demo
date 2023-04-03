
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


const getTradingPairKey = (pair, priority = currencyPriority) => {
    const [firstToken, secondToken] = compareTokens(
        pair.base_token_id,
        pair.counter_token_id,
        priority
    );

    return `${getTokenName(firstToken, priority)}/${getTokenName(secondToken, priority)}`;
};

const localizeCurrency = (bool, num) => {
    if (bool) {
        return num;
    } else {
        return 1 / num;
    }
}

// This function selects quotes from an array using the pseudoOutputAmounts to fulfill the desired amount
// The function takes in two parameters:
// 1. desiredAmount: a number representing the desired quantity of pseudoOutputAmount
// 2. quotes: an array of objects representing different quotes all for one specific pair

// If the desiredAmount is zero, the function returns the quote with the lowest price.
// Otherwise, the function selects quotes from the quotes array based on the price until the sum of the quotes is greater than the desired amount.
// If the sum of the selected pseudo output amounts exceeds the desired amount, the function returns 1 prorated quote with the worst price of the selected quotes to fulfill the amount exactly.

// The function returns an array of two elements:
// 1. selectedQuotes: an array of selected quotes, at most one of which is potentially prorated
// 2. selectedRatio: a number representing the average price for the amount expressed as a ratio of desired/provided. If the quantity is insufficient it returns a special string indicating that the depth of book has been exceeded.
const selectQuotesForDesiredAmount = (desiredAmount, quotes) => {
    // if (!quotes.every(q => q.pair === quotes[0].pair)) {
    //     console.error("All quotes should be for the same pair");
    //     return null;
    // }

    const baseToken = quotes[0].pair.base_token_id;
    const counterToken = quotes[0].pair.counter_token_id;
    const isBaseTokenFirst = compareTokens(baseToken, counterToken, currencyPriority) < 0;

    // If desiredAmount is 0, just return the best quote.
    if (desiredAmount === 0) {
        const sortedQuotes = quotes.sort((a, b) => a.requiredOutputAmounts[0] / a.pseudoOutputAmount - b.requiredOutputAmounts[0] / b.pseudoOutputAmount);
        return [sortedQuotes[0], localizeCurrency(isBaseTokenFirst, sortedQuotes[0].requiredOutputAmounts[0] / sortedQuotes[0].pseudoOutputAmount)];
    }

    const sortedQuotes = quotes.sort((a, b) => a.requiredOutputAmounts[0] / a.pseudoOutputAmount - b.requiredOutputAmounts[0] / b.pseudoOutputAmount);

    let selectedQuotes = [];
    let selectedPseudoOutputAmount = 0;

    for (const quote of sortedQuotes) {
        if (selectedPseudoOutputAmount + quote.pseudoOutputAmount <= desiredAmount) {
            selectedQuotes.push(quote);
            selectedPseudoOutputAmount += quote.pseudoOutputAmount;
        } else {
            const remainingPseudoOutputAmount = desiredAmount - selectedPseudoOutputAmount;
            const selectedQuoteRatio = quote.requiredOutputAmounts[0] / quote.pseudoOutputAmount;
            const proratedRequiredOutputAmount = selectedQuoteRatio * remainingPseudoOutputAmount;
            const proratedQuote = {
                ...quote,
                requiredOutputAmounts: [proratedRequiredOutputAmount],
                pseudoOutputAmount: remainingPseudoOutputAmount,
            };
            selectedQuotes.push(proratedQuote);
            break;
        }
    }

    const selectedPseudoOutputTotal = selectedQuotes.reduce((total, quote) => {
        return total + quote.pseudoOutputAmount;
    }, 0);
    const selectedRequiredOutputTotal = selectedQuotes.reduce((total, quote) => {
        return total + quote.requiredOutputAmounts[0]
    }, 0);
    if (selectedPseudoOutputTotal !== desiredAmount) {
        return [selectedQuotes, "Insufficient depth of book"];
    }
    const selectedRatio = selectedRequiredOutputTotal / selectedPseudoOutputTotal;

    return [selectedQuotes, localizeCurrency(isBaseTokenFirst, selectedRatio)];
};

module.exports = {
    selectQuotesForDesiredAmount,
    getTradingPairKey,
    getTokenName,
    compareTokens,
};
