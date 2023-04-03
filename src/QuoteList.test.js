const { getPairKey, getTokenName } = require('./QuoteHelper.js');

describe('getPairKey', () => {

    const currencyPriority = [
        { name: "GBP", tokenId: 0 },
        { name: "EUR", tokenId: 1 },
        { name: "USD", tokenId: 2 }
    ];
    

    it('should return the correct pair key', () => {
        const pair = { base_token_id: 0, counter_token_id: 2 };
        expect(getPairKey(pair, currencyPriority)).toBe('GBP/USD');
    });

    it('should return the correct pair key when tokens are in reverse order', () => {
        const pair = { base_token_id: 0, counter_token_id: 2 };
        expect(getPairKey(pair, currencyPriority)).toBe('GBP/USD');
    });

    it('should return name using token_id when the tokens are not found in the currencyPriority array', () => {
        const pair = { base_token_id: 0, counter_token_id: 3 };
        expect(getPairKey(pair, currencyPriority)).toBe("GBP/3");
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
