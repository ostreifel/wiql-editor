 import { expect, assert } from "chai";
import { parse } from "../compiler/wiqlParser";
import { NameErrorChecker } from "../wiqlErrorCheckers/NameErrorChecker";
import { FieldType } from "../vssContracts";
import { mock as mockMonaco } from "./mockMonaco";
import { WorkItemField } from "TFS/WorkItemTracking/Contracts";

function mockField(name: string): WorkItemField {
    return {
        name,
        readOnly: false,
        _links: [],
        referenceName: `ref.${name.replace(/ /g, "")}`,
        type: FieldType.String,
        supportedOperations: [],
        url: ""
    };
}
mockMonaco();

describe("Namechecker", () => {
    it("missing fields", () => {
        const wiqlStr = `
SELECT
    [a], b
FROM workitemlinks
WHERE c = 1`;
        const lines = parse(wiqlStr.split("\n"));
        const fields: WorkItemField[] = [mockField("a")];
        const checker = new NameErrorChecker(fields);
        const errors = checker.check(lines);
        expect(errors.length).to.be.eq(2, "Expected b and c to error");
    });
    it("missing var", () => {
        const wiqlStr = `
SELECT
    a
FROM workitemlinks
WHERE c = @me or c = @project or d = @invalid`;
        const lines = parse(wiqlStr.split("\n"));
        const fields: WorkItemField[] = [mockField("a")];
        const checker = new NameErrorChecker(fields);
        const errors = checker.check(lines);
        expect(errors.length).to.be.eq(1, "Expected @invalid to error");
    });
});
