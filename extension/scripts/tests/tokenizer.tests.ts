import { expect } from "chai";
import { tokenize } from "../compiler/tokenizer";
import { wiqlPatterns } from "../compiler/wiqlTokenPatterns";
import * as Symbols from "../compiler/wiqlSymbols";


describe("Tokenizer", () => {
    it("keyword", () => {
        const tokens = tokenize(["and"], wiqlPatterns);
        expect(tokens[0]).to.be.instanceof(Symbols.And);
    });
    it("boolean", () => {
        const tokens = tokenize(["true"], wiqlPatterns);
        expect(tokens[0]).to.be.instanceof(Symbols.True);
    });
    it("select id", () => {
        const tokens = tokenize(["select Id"], wiqlPatterns);
        expect(tokens[0]).to.be.instanceof(Symbols.Select);
        expect(tokens[1]).to.be.instanceof(Symbols.Identifier);
        expect(tokens.length).to.be.eq(2);
    });
    it("[source].", () => {
        const tokens = tokenize(["[source]."], wiqlPatterns);
        expect(tokens[1]).to.be.instanceof(Symbols.Source);
        expect(tokens.length).to.be.eq(4);
    });
});

describe("Symbols", () => {
    it("number", () => {
        const inputs: Symbols.Symbol[] = [new Symbols.Minus(0, 1, "-"), new Symbols.Digits(1, 1, "asdf")];
        const num = new Symbols.Number(inputs);
        expect(num.digits).to.be.instanceof(Symbols.Digits);
        expect(num.minus).to.be.instanceof(Symbols.Minus);
    });
});
