import { FieldType } from "../vssContracts";

export function mockField(name: string) {
    return {
        name,
        readOnly: false,
        _links: [],
        referenceName: `ref.${name.replace(/ /g, "")}`,
        type: FieldType.String,
        supportedOperations: [],
        url: ""
    };
};
declare var global;
export function mockMonaco() {
    enum CompletionItemKind {
        Text = 0,
        Method = 1,
        Function = 2,
        Constructor = 3,
        Field = 4,
        Variable = 5,
        Class = 6,
        Interface = 7,
        Module = 8,
        Property = 9,
        Unit = 10,
        Value = 11,
        Enum = 12,
        Keyword = 13,
        Snippet = 14,
        Color = 15,
        File = 16,
        Reference = 17,
    }
    class Position {
        constructor(readonly lineNumber: number, readonly column: number) { }
    }
    const monaco = {
        Range: () => { },
        Position: Position,
        languages: { CompletionItemKind: CompletionItemKind }
    };
    // chai runner wants self, node wants global
    (typeof self === "undefined" ? global : self)["monaco"] = monaco;
}
