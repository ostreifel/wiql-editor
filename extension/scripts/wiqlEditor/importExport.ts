function toDocument(wiql: string): string {
    const rootDoc = jQuery.parseXML(`<WorkItemQuery Version="1"/>`);
    const root = rootDoc.documentElement;

    const server = rootDoc.createElement("TeamFoundationServer");
    server.appendChild(document.createTextNode(VSS.getWebContext().collection.uri));
    root.appendChild(server);

    const project = rootDoc.createElement("TeamProject");
    project.appendChild(document.createTextNode(VSS.getWebContext().project.name));
    root.appendChild(project);

    const wiqlNode = rootDoc.createElement("Wiql");
    wiqlNode.appendChild(document.createTextNode(wiql));
    root.appendChild(wiqlNode);

    return new XMLSerializer().serializeToString(rootDoc);
}

function fromDocument(documentStr: string) {
    if (documentStr[0] !== "<") {
        // v1.5.1 format was just the wiql string
        return documentStr;
    }
    return $(jQuery.parseXML(documentStr)).find("Wiql").text();
}

export function importWiq(editor: monaco.editor.IStandaloneCodeEditor) {
        const files = $(".wiq-input")[0]["files"];
        if (!files || files.length === 0) {
            console.log("No file selected");
        }
        const reader = new FileReader();
        const model = editor.getModel();
        reader.onload = () => {
            const documentText: string = reader.result;
            const wiql = fromDocument(documentText);
            const edit = <monaco.editor.IIdentifiedSingleEditOperation>{
                text: wiql,
                range: model.getFullModelRange(),
                forceMoveMarkers: true,
            };
            model.pushEditOperations(editor.getSelections(), [edit], () => [new monaco.Selection(1, 1, 1, 1)]);
        };
        reader.readAsText(files[0]);
        $(".wiq-input").val("");
}
export function exportWiq(editor: monaco.editor.IStandaloneCodeEditor, queryName?: string) {
    const documentStr = toDocument(editor.getModel().getValue());
    const blob = new Blob([documentStr], {type: "text/plain;charset=utf-8;"});
    let name = queryName || prompt("Enter file name") || "query";
    if (name.toLocaleLowerCase().indexOf(".wiq", name.length - 4) < 0) {
        name += ".wiq";
    }

    // IE workaround
    if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, name);
    } else {
        const a = document.createElement("a");
        a.href = window.URL.createObjectURL(blob);
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}
