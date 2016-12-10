import { expect, assert } from 'chai';
import { tokenize } from './wiqlTokenizer';
import * as Symbols from './wiqlSymbols';
import {parse} from './wiqlParser';


describe('Parser', () => {
    it('Basic test', () => {
        const {wiqlTree} = parse(['Select id from workitems']);
        expect(wiqlTree instanceof Symbols.FlatSelect, 'root is flatselect').to.be.true;
    });
});

describe('Tokenizer', () => {
    it('Basic test', () => {
        const tokens = tokenize(['select Id']);
        expect(tokens.length).to.be.eq(2);
    });
});
