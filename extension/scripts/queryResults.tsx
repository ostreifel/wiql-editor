import * as ReactDom from "react-dom";
import * as React from "react";
import {
    WorkItemQueryResult, WorkItem, WorkItemFieldReference
} from "TFS/WorkItemTracking/Contracts";

class WorkItemRow extends React.Component<{ wi: WorkItem, columns: WorkItemFieldReference[], rel?: string }, void> {
    render() {
        const uri = VSS.getWebContext().host.uri;
        const project = VSS.getWebContext().project.name;
        const wiUrl = `${uri}${project}/_workitems?id=${this.props.wi.id}&_a=edit&fullScreen=true`;

        const tds: JSX.Element[] = [];
        if (this.props.rel) {
            tds.push(<div className={"cell"} title={"Link Type"}>{this.props.rel}</div>);
        }
        for (const fieldRef of this.props.columns) {
            tds.push(<div className={"cell"} title={fieldRef.name}>{this.props.wi.fields[fieldRef.referenceName]}</div>);
        }
        return (
            <a
                className={"row"}
                tabIndex={0}
                href={wiUrl}
                target={"_blank"}
                rel={"noreferrer"}
                onKeyDown={e => {
                    if (e.keyCode === 40) {
                        $(":focus").next().focus();

                    }
                    if (e.keyCode === 38) {
                        $(":focus").prev().focus();

                    }}
                }
                >
                {tds}
            </a>
        );
    }
}

class WorkItemTable extends React.Component<{ workItems: WorkItem[], result: WorkItemQueryResult }, void> {
    render() {
        const wiMap = {};
        for (let wi of this.props.workItems) {
            wiMap[wi.id] = wi;
        }
        const workItems = this.props.result.workItems
            .filter(wi => wi.id in wiMap)
            .map((wi) => wiMap[wi.id]);
        const rows = workItems.map((wi) => <WorkItemRow wi={wi} columns={this.props.result.columns} />);
        return <div className={"table"}>{rows}</div>;
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
        const rows = this.props.result.workItemRelations
            .filter(wi => wi.target.id in wiMap)
            .map(rel =>
            <WorkItemRow
                rel={rel.rel || "Source"}
                columns={this.props.result.columns}
                wi={wiMap[rel.target.id]}
                />
        );
        return <div className={"table"}>{rows}</div>;
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
    const elem = document.getElementById("header-bar");
    if (!elem) {
        return;
    }
    ReactDom.render(
            <div className="header">
                <span className="bowtie">
                    <input className="wiq-input" accept=".wiq" type="file"/>
                    <button onClick={() => $(".wiq-input").click()}>Import</button>
                    <button className="wiq-export">Export</button>
                </span>
                <span className="links">
                    <a href="https://marketplace.visualstudio.com/items?itemName=ottostreifel.wiql-editor" target="_blank">Review</a>{" | "}
                    <a href="https://github.com/ostreifel/wiql-editor/issues" target="_blank">Report an issue</a>{" | "}
                    <a href="mailto:wiqleditor@microsoft.com" target="_blank">Feedback and questions</a>
                </span>
            </div>
        , elem);
}
