import { expect, assert } from 'chai';
import { tokenize } from './wiqlTokenizer';
import * as Symbols from './wiqlSymbols';
import { parse } from './wiqlParser';


// describe('Parser', () => {
//     it('Basic test', () => {
//         const {wiqlTree} = parse(['Select id from workitems']);
//         expect(wiqlTree instanceof Symbols.FlatSelect, 'root is flatselect').to.be.true;
//     });
// });



describe('Tokenizer', () => {
    it('keyword', () => {
        const tokens = tokenize(['and']);
        expect(tokens[0] instanceof Symbols.And, 'and parsed').to.be.true;
    });
    it('boolean', () => {
        const tokens = tokenize(['true']);
        expect(tokens[0] instanceof Symbols.True, 'true parsed').to.be.true;
    });
    it('select id', () => {
        const tokens = tokenize(['select Id']);
        expect(tokens[0] instanceof Symbols.Select, 'expecting select').to.be.true;
        expect(tokens[1] instanceof Symbols.Identifier, 'expecting Identifier').to.be.true;
        expect(tokens.length).to.be.eq(3);
    });
});

describe('Symbols', () => {
    it('number', () => {
        const inputs: Symbols.Symbol[] = [new Symbols.Minus(0, 1, '-'), new Symbols.Digits(1, 1, 'asdf')];
        const num = new Symbols.Number(inputs);
        expect(num.digits instanceof Symbols.Digits, 'expecting digits').to.be.true;
        expect(num.minus instanceof Symbols.Minus, 'expecting minus').to.be.true;
    });
});