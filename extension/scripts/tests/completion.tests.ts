import { expect } from "chai";
import { mockMonaco, mockField } from "./mocks";
mockMonaco();
import { getCompletionProvider } from "../wiqlCompletion";

describe("Completion", () => {
    // The completion suggests way too many symbols. May need to switch from slr to lr
    const provider = getCompletionProvider([mockField("Sample Field")]);
    const mockModel = (content: string) => {
        return {
            getLinesContent: () => content.split("\n")
        } as monaco.editor.IReadOnlyModel;
    };
    const mockCancel: monaco.CancellationToken = { isCancellationRequested: false, onCancellationRequested: () => { return { dispose: () => { } } } };
    const selectmodel = mockModel(`SELECT
a, b
from workitems
where
    a=2
    and a=b
order by a desc
asof 'date'
`);
    it("empty", () => {
        const items = provider.provideCompletionItems(selectmodel, new monaco.Position(1, 1), mockCancel) as monaco.languages.CompletionItem[];
        expect(items.length).to.be.eq(1);
        expect(items[0].label).to.be.eq("SELECT");
    });
    it("field", () => {
        const items = provider.provideCompletionItems(selectmodel, new monaco.Position(2, 1), mockCancel) as monaco.languages.CompletionItem[];
        expect(items.length).to.be.eq(1);
        expect(items[0].label).to.be.eq("ref.SampleField");
    });
});