import { expect } from "chai";
import { mockMonaco, mockField } from "./mocks";
import { getCompletionProvider } from "../wiqlCompletion";
mockMonaco();

describe("Completion", () => {
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
    it("before field", () => {
        const items = provider.provideCompletionItems(selectmodel, new monaco.Position(2, 1), mockCancel) as monaco.languages.CompletionItem[];
        expect(items.length).to.be.eq(2);
        expect(items[0].label).to.be.eq("[");
        expect(items[1].label).to.be.eq("ref.SampleField");
    });
    it("after field", () => {
        const items = provider.provideCompletionItems(selectmodel, new monaco.Position(3, 1), mockCancel) as monaco.languages.CompletionItem[];
        expect(items.length).to.be.eq(2);
        expect(items[0].label).to.be.eq(",");
        expect(items[1].label).to.be.eq("FROM");
    });
});