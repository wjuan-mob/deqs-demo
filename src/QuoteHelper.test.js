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
            requiredOutputAmounts: [30],
            pseudoOutputAmount: 10,
        },
        {
            pair: {
                base_token_id: 1,
                counter_token_id: 2,
            },
            requiredOutputAmounts: [50],
            pseudoOutputAmount: 10,
        },
        {
            pair: {
                base_token_id: 1,
                counter_token_id: 2,
            },
            requiredOutputAmounts: [10],
            pseudoOutputAmount: 50,
        }
    ];
    it('returns the best quote if desiredAmount is 0', () => {
        const [selectedQuote, selectedRatio] = selectQuotesForDesiredAmount(0, [...mockQuotes]);
        expect(selectedQuote).toEqual(mockQuotes[2]);
        expect(selectedRatio).toEqual(5);
    });


    it('returns the quotes that add up to desiredAmount', () => {
        const [selectedQuote, selectedRatio] = selectQuotesForDesiredAmount(60, [...mockQuotes]);
        expect(selectedQuote).toEqual([mockQuotes[2], mockQuotes[0]]);
        expect(selectedRatio).toEqual(60 / 40);
    });

    it('returns a prorated quote if the sum of the selected quotes exceeds desiredAmount', () => {
        const [selectedQuote, selectedRatio] = selectQuotesForDesiredAmount(35, [...mockQuotes]);
        expect(selectedQuote).toEqual([{
            pair: {
                base_token_id: 1,
                counter_token_id: 2,
            },
            requiredOutputAmounts: [10 / 50 * 35],
            pseudoOutputAmount: 35,
        }]);
        expect(selectedRatio).toEqual(5);
    });

    it('returns depth of book if the sum of the selected quotes is less than desiredAmount', () => {
        const [selectedQuotes, selectedRatio] = selectQuotesForDesiredAmount(100, mockQuotes);
        expect(selectedQuotes).toEqual([mockQuotes[0], mockQuotes[1], mockQuotes[2]]);
        expect(selectedRatio).toEqual('Insufficient depth of book');
    });
});
