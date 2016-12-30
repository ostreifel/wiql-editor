import * as ReactDom from "react-dom";
import * as React from "react";
import {
    WorkItemQueryResult, QueryResultType, WorkItemReference,
    WorkItemRelation, WorkItem, WorkItemFieldReference, WorkItemLink
} from "TFS/WorkItemTracking/Contracts";

class WorkItemRow extends React.Component<{ wi: WorkItem, columns: WorkItemFieldReference[], rel?: string }, void> {
    render() {
        const uri = VSS.getWebContext().host.uri;
        const project = VSS.getWebContext().project.name;
        const wiUrl = `${uri}${project}/_workitems?id=${this.props.wi.id}&fullScreen=true`;

        const tds: JSX.Element[] = [];
        if (this.props.rel) {
            tds.push(<td title={"Link Type"}>{this.props.rel}</td>);
        }
        for (const fieldRef of this.props.columns) {
            tds.push(<td title={fieldRef.name}>{this.props.wi.fields[fieldRef.referenceName]}</td>);
        }
        return (
            <tr
                tabIndex={0}
                onClick={() => window.open(wiUrl, "_blank")}
                onKeyPress={e => {
                    if (e.key === "Enter") {
                        window.open(wiUrl, "_blank");
                    }
                }
                }
                >
                {tds}
            </tr>
        );
    }
}

class WorkItemTable extends React.Component<{ workItems: WorkItem[], result: WorkItemQueryResult }, void> {
    render() {
        const wiMap = {};
        for (let wi of this.props.workItems) {
            wiMap[wi.id] = wi;
        }
        const workItems = this.props.result.workItems.map((wi) => wiMap[wi.id]);
        const rows = workItems.map((wi) => <WorkItemRow wi={wi} columns={this.props.result.columns} />);
        return <table><tbody>{rows}</tbody></table>;
    }
}

class ResultCountDisclaimer extends React.Component<{ count: number }, void> {
    render() {
        const message = this.props.count < 50 ? `Found ${this.props.count} results` : `Showing first 50 results`;
        return <div>{message}</div>;
    }

}

class WorkItemRelationsTable extends React.Component<{ result: WorkItemQueryResult, workItems: WorkItem[] }, void> {
    render() {
        const wiMap: { [id: number]: WorkItem } = {};
        for (let workitem of this.props.workItems) {
            wiMap[workitem.id] = workitem;
        }
        const rows = this.props.result.workItemRelations.map(rel =>
            <WorkItemRow
                rel={rel.rel || "Source"}
                columns={this.props.result.columns}
                wi={wiMap[rel.target.id]}
                />
        );
        return <table><tbody>{rows}</tbody></table>;
    }
}

export function renderResult(result: WorkItemQueryResult, workItems: WorkItem[]) {
    let table: JSX.Element;
    if (result.workItems) {
        table = <WorkItemTable workItems={workItems} result={result} />;
    } else {
        table = <WorkItemRelationsTable workItems={workItems} result={result} />;
    }
    ReactDom.render(
        <div>
            {table}
            <ResultCountDisclaimer count={(result.workItems || result.workItemRelations).length} />
        </div>
        , document.getElementById("query-results") as HTMLElement);
}

export function setError(error: TfsError | string) {
    const message = typeof error === "string" ? error : (error.serverError || error)["message"];
    ReactDom.render(<div className={"error-message"}>{message}</div>, document.getElementById("query-results") as HTMLElement);
}

export function setMessage(message: string | string[]) {
    if (typeof message === "string") {
        message = [message];
    }
    const messageElems = message.map((m) => <div>{m}</div>);
    ReactDom.render(<div>{messageElems}</div>, document.getElementById("query-results") as HTMLElement);
}

export function setVersion() {
    const elem = document.getElementById("version-info");
    if (!elem) {
        return;
    }
    const context = VSS.getExtensionContext();
    ReactDom.render(
            <div>
                <a href={"https://github.com/ostreifel/wiql-editor/issues"} target={"_blank"}>Report an issue</a>{" or "}
                <a href={"mailto:wiqleditor@microsoft.com"} target={"_blank"}>Feedback and questions</a>
            </div>
        , elem);
}
