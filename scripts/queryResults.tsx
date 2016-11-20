import * as ReactDom from "react-dom";
import * as React from "react";
import {WorkItemQueryResult, QueryResultType, WorkItemReference, WorkItemRelation} from "TFS/WorkItemTracking/Contracts";

class WorkItemRow extends React.Component<{wiRef: WorkItemReference}, void> {
    render() {
        const uri = VSS.getWebContext().host.uri;
        const project = VSS.getWebContext().project.name;
        const wiUrl = `${uri}${project}/_workitems?id=${this.props.wiRef.id}&fullScreen=true`;
        return <tr><td><a href={wiUrl} target={'_blank'}>{this.props.wiRef.id}</a></td></tr>;
    }
}

class QueryResults extends React.Component<{results: WorkItemQueryResult}, void> {
    render() {
        let rows;
        if (this.props.results.queryResultType === QueryResultType.WorkItem) {
            rows = this.props.results.workItems.map((wi) => <WorkItemRow wiRef={wi} />);
        } else {
            rows = <tr><td>{'TODO work item relations'}</td></tr>
        }
        return <table><tbody>{rows}</tbody></table>;
    }
}

export function renderQueryResults(result: WorkItemQueryResult) {
    ReactDom.render(<QueryResults results={result}/>, document.getElementById('query-results'));
}

export function renderQueryError(error: TfsError) {
    ReactDom.render(<div>{error.serverError['message']}</div>, document.getElementById('query-results'));
}