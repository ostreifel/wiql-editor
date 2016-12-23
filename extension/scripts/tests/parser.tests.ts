import { parse } from "../compiler/wiqlParser";
import * as Symbols from "../compiler/wiqlSymbols";
import { expect, assert } from "chai";

describe("Parser", () => {
    it("FlatSelect", () => {
        const wiqlStr = `
        SELECT [a], b.a FROM WorkItems 
        where c < 4
            or c = d 
            and e contains words 'asdf'
        order by asdfpoij desc
        ASOF 'asdf'
        `;
        const select = parse(wiqlStr.split("\n"));
        expect(select instanceof Symbols.FlatSelect, "Flat Select did not get parsed").to.be.true;
    });
    it("OneHopSelect", () => {
        const wiqlStr = `
        SELECT [a], b.a FROM WorkItemLinks 
        where [source].a = b AND [target].b = 54
        order by [target].asdfpoij desc
        ASOF 'asdf'
        mode (MustContain)
        `;
        const select = parse(wiqlStr.split("\n"));
        expect(select instanceof Symbols.OneHopSelect, "OneHopSelect did not get parsed").to.be.true;
    });
});
