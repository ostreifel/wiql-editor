import { expect } from 'chai';
import { tokenize } from './wiqlTokenizer';


describe("Tokenizer", () => {
    it("Basic test", () => {
        const tokens = tokenize('Select id from workitems where id=1 and title contains """"');

        expect(['select', 'id', 'from', 'workitems', 'where', 'id', '=', '1',
            'and', 'title', 'contains', '""""']).to.deep.equal(tokens);
    });
});