import { expect, assert } from "chai";
import { tokenize } from "../compiler/tokenizer";
import { wiqlPatterns } from "../compiler/wiqlTokenPatterns";
import * as Symbols from "../compiler/wiqlSymbols";
import { parse } from "../compiler/wiqlParser";


describe("Tokenizer", () => {
    it("keyword", () => {
        const tokens = tokenize(["and"], wiqlPatterns);
        expect(tokens[0] instanceof Symbols.And, "and parsed").to.be.true;
    });
    it("boolean", () => {
        const tokens = tokenize(["true"], wiqlPatterns);
        expect(tokens[0] instanceof Symbols.True, "true parsed").to.be.true;
    });
    it("select id", () => {
        const tokens = tokenize(["select Id"], wiqlPatterns);
        expect(tokens[0] instanceof Symbols.Select, "expecting select").to.be.true;
        expect(tokens[1] instanceof Symbols.Identifier, "expecting Identifier").to.be.true;
        expect(tokens.length).to.be.eq(2);
    });
    it("[source].", () => {
        const tokens = tokenize(["[source]."], wiqlPatterns);
        expect(tokens[1] instanceof Symbols.Source, "expecting source").to.be.true;
        expect(tokens.length).to.be.eq(4);
    });
});

describe("Symbols", () => {
    it("number", () => {
        const inputs: Symbols.Symbol[] = [new Symbols.Minus(0, 1, "-"), new Symbols.Digits(1, 1, "asdf")];
        const num = new Symbols.Number(inputs);
        expect(num.digits instanceof Symbols.Digits, "expecting digits").to.be.true;
        expect(num.minus instanceof Symbols.Minus, "expecting minus").to.be.true;
    });
});