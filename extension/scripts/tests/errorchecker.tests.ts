import { expect } from "chai";
import { parse } from "../compiler/wiqlParser";
import { NameErrorChecker } from "../wiqlErrorCheckers/NameErrorChecker";
import { PrefixChecker } from "../wiqlErrorCheckers/PrefixChecker";
import { mockMonaco, mockField } from "./mocks";

mockMonaco();

describe("Namechecker", () => {
    it("missing fields", () => {
        const wiqlStr = `
SELECT
    [a], b
FROM workitemlinks
WHERE c = 1`;
        const results = parse(wiqlStr.split("\n"));
        const fields = [mockField("a")];
        const checker = new NameErrorChecker(fields);
        const errors = checker.check(results);
        expect(errors.length).to.be.eq(2, "Expected b and c to error");
    });
    it("missing var", () => {
        const wiqlStr = `
SELECT
    a
FROM workitemlinks
WHERE a = @me or a = @project or a = @invalid`;
        const results = parse(wiqlStr.split("\n"));
        const fields = [mockField("a")];
        const checker = new NameErrorChecker(fields);
        const errors = checker.check(results);
        expect(errors.length).to.be.eq(1, "Expected @invalid to error");
    });
});
describe("PrefixChecker", () => {
    it("missing prefix", () => {
        const wiqlStr = `select a
            from workitemlinks
            where a = 2`;
        const results = parse(wiqlStr.split("\n"));
        const checker = new PrefixChecker();
        const errors = checker.check(results);
        expect(errors.length).to.be.eq(1, "Expected prefix");
    });

    it("mixed prefix", () => {
        const wiqlStr = `select a
            from workitemlinks
            where (
                source.a = 2
                and target.a = 2
            )
            and source.a = 2`;
        const results = parse(wiqlStr.split("\n"));
        const checker = new PrefixChecker();
        const errors = checker.check(results);
        expect(errors.length).to.be.eq(1, "Cannot mix prefixes");
    });

    it("two clauses", () => {
        const wiqlStr = `select a
            from workitemlinks
            where
                source.a = 2
                and target.a = 2`;
        const results = parse(wiqlStr.split("\n"));
        const checker = new PrefixChecker();
        const errors = checker.check(results);
        expect(errors.length).to.be.eq(0, "No errors expected");
    });
});
