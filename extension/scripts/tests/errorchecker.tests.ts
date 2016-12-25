import { expect, assert } from "chai";
import { parse } from "../compiler/wiqlParser";
import { ErrorChecker } from "../wiqlErrorCheckers/ErrorChecker";
import { WorkItemField, FieldType } from "TFS/WorkItemTracking/Contracts";

function mockField(name: string): WorkItemField {
    return {
        name,
        readOnly: false,
        _links: [],
        referenceName: `ref.${name.replace(/ /g, "")}`,
        type: FieldType.String,
        supportedOperations: [],
        url: ""
    }
}

describe("Namechecker", () => {
    it("Namechecker", () => {
        const wiqlStr = `
SELECT
    [a], b
FROM workitemlinks
WHERE c = 1`;
        const result = parse(wiqlStr.split("\n"));
        const fields: WorkItemField[] = [mockField("a")];
        const checker = new ErrorChecker(fields);
        const errors = checker.check(result);
        expect(errors.length).to.be.eq(2, "Expected b and c to error");
    });
});
