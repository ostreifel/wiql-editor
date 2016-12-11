import * as ReactDom from 'react-dom';
import * as React from 'react';
import {
    WorkItemQueryResult, QueryResultType, WorkItemReference,
    WorkItemRelation, WorkItem, WorkItemFieldReference
} from 'TFS/WorkItemTracking/Contracts';

class WorkItemRow extends React.Component<{ wi: WorkItem, columns: WorkItemFieldReference[] }, void> {
    render() {
        const uri = VSS.getWebContext().host.uri;
        const project = VSS.getWebContext().project.name;
        const wiUrl = `${uri}${project}/_workitems?id=${this.props.wi.id}&fullScreen=true`;

        const tds: JSX.Element[] = [];
        for (const fieldRef of this.props.columns) {
            tds.push(<td title={fieldRef.name}>{this.props.wi.fields[fieldRef.referenceName]}</td>);
        }
        return (
            <tr onClick={() => window.open(wiUrl, '_blank')}>
                {tds}
            </tr>
        );
    }
}

class WiQueryResults extends React.Component<{ workItems: WorkItem[], columns: WorkItemFieldReference[]}, void> {
    render() {
        const rows = this.props.workItems.map((wi) => <WorkItemRow wi={wi} columns={this.props.columns} />);
        return <table><tbody>{rows}</tbody></table>;
    }
}

export function renderQueryResults(result: WorkItemQueryResult, workItems: WorkItem[]) {
    let resultsView: JSX.Element;
    if (result.queryResultType = QueryResultType.WorkItem) {
        resultsView = <WiQueryResults workItems={workItems} columns={result.columns} />;
    } else {
        resultsView = <div>{'TODO render work item relations'}</div>;
    }
    ReactDom.render(resultsView, document.getElementById('query-results') as HTMLElement);
}

export function setError(error: TfsError | string) {
    const message = typeof error === 'string' ? error : (error.serverError || error)['message'];
    ReactDom.render(<div className={'error-message'}>{message}</div>, document.getElementById('query-results') as HTMLElement);
}

export function setMessage(message: string | string[]) {
    if (typeof message === 'string') {
        message = [message];
    }
    const messageElems = message.map((m) => <div>{m}</div>);
    ReactDom.render(<div>{messageElems}</div>, document.getElementById('query-results') as HTMLElement);
}