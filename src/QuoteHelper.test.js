const { getTradingPairKey, getTokenName, selectQuotesForDesiredAmount } = require('./QuoteHelper.js');

describe('getPairKey', () => {

    const currencyPriority = [
        { name: "GBP", tokenId: 0 },
        { name: "EUR", tokenId: 1 },
        { name: "USD", tokenId: 2 }
    ];


    it('should return the correct pair key', () => {
        const pair = { base_token_id: 0, counter_token_id: 2 };
        expect(getTradingPairKey(pair, currencyPriority)).toBe('GBP/USD');
    });

    it('should return the correct pair key when tokens are in reverse order', () => {
        const pair = { base_token_id: 0, counter_token_id: 2 };
        expect(getTradingPairKey(pair, currencyPriority)).toBe('GBP/USD');
    });

    it('should return name using token_id when the tokens are not found in the currencyPriority array', () => {
        const pair = { base_token_id: 0, counter_token_id: 3 };
        expect(getTradingPairKey(pair, currencyPriority)).toBe("GBP/3");
    });
    it('getTokenName returns correct name when token is in currencyPriority', () => {
        const token1 = 0;
        const token2 = 2;
        const expected1 = 'GBP';
        const expected2 = 'USD';
        const actual1 = getTokenName(token1, currencyPriority);
        const actual2 = getTokenName(token2, currencyPriority);
        expect(actual1).toBe(expected1);
        expect(actual2).toBe(expected2);
    });

    it('getTokenName returns correct name when token is not in currencyPriority', () => {
        const token1 = 0;
        const token2 = 3;
        const expected1 = 'GBP';
        const expected2 = '3';
        const actual1 = getTokenName(token1, currencyPriority);
        const actual2 = getTokenName(token2, currencyPriority);
        expect(actual1).toBe(expected1);
        expect(actual2).toBe(expected2);
    });

});

describe('selectQuotesForDesiredAmount', () => {
    const mockQuotes = [
        {
            pair: {
                base_token_id: 1,
                counter_token_id: 2,
            },
            requiredOutputAmounts: { amount: 30, tokenId: 2 },
            pseudoOutputAmount: { amount: 10, tokenId: 1 },
        },
        {
            pair: {
                base_token_id: 1,
                counter_token_id: 2,
            },
            requiredOutputAmounts: { amount: 50, tokenId: 2 },
            pseudoOutputAmount: { amount: 10, tokenId: 1 },
        },
        {
            pair: {
                base_token_id: 1,
                counter_token_id: 2,
            },
            requiredOutputAmounts: { amount: 10, tokenId: 2 },
            pseudoOutputAmount: { amount: 50, tokenId: 1 },
        }
    ];
    it('returns the best quote if desiredAmount is 0', () => {
        const { quotes: selectedQuotes, price: selectedRatio } = selectQuotesForDesiredAmount(0, [...mockQuotes]);
        expect(selectedQuotes).toEqual(mockQuotes[2]);
        expect(selectedRatio).toEqual(5);
    });


    it('returns the quotes that add up to desiredAmount', () => {
        const { quotes: selectedQuotes, price: selectedRatio } = selectQuotesForDesiredAmount(60, [...mockQuotes]);
        expect(selectedQuotes).toEqual([mockQuotes[2], mockQuotes[0]]);
        expect(selectedRatio).toEqual(60 / 40);
    });


    it('returns a prorated quote if the sum of the selected quotes exceeds desiredAmount', () => {
        const { quotes: selectedQuotes, price: selectedRatio } = selectQuotesForDesiredAmount(35, [...mockQuotes]);
        expect(selectedQuotes).toEqual([{
            pair: {
                base_token_id: 1,
                counter_token_id: 2,
            },
            requiredOutputAmounts: {amount: 10 / 50 * 35, tokenId: 2},
            pseudoOutputAmount: {amount: 35, tokenId: 1},
        }]);
        expect(selectedRatio).toEqual(5);
    });

    it('returns depth of book if the sum of the selected quotes is less than desiredAmount', () => {
        const { quotes: selectedQuotes, price: selectedRatio } = selectQuotesForDesiredAmount(100, mockQuotes);
        expect(selectedQuotes).toEqual([mockQuotes[0], mockQuotes[1], mockQuotes[2]]);
        expect(selectedRatio).toEqual('Insufficient depth of book');
    });
});
