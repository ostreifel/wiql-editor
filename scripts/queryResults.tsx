import * as ReactDom from 'react-dom';
import * as React from 'react';
import {WorkItemQueryResult, QueryResultType, WorkItemReference, WorkItemRelation, WorkItem} from 'TFS/WorkItemTracking/Contracts';

class WorkItemRow extends React.Component<{wi: WorkItem}, void> {
    render() {
        const uri = VSS.getWebContext().host.uri;
        const project = VSS.getWebContext().project.name;
        const wiUrl = `${uri}${project}/_workitems?id=${this.props.wi.id}&fullScreen=true`;

        const tds: JSX.Element[] = [];
        for (const refName in this.props.wi.fields) {
            tds.push(<td title={refName}>{this.props.wi.fields[refName]}</td>);
        }
        return (
            <tr onClick={() => window.open(wiUrl, '_blank')}>
                {tds}
            </tr>
        );
    }
}

class WiQueryResults extends React.Component<{workItems: WorkItem[]}, void> {
    render() {
        const rows = this.props.workItems.map((wi) => <WorkItemRow wi={wi} />);
        return <table><tbody>{rows}</tbody></table>;
    }
}

export function renderQueryResults(result: WorkItemQueryResult, workItems: WorkItem[]) {
    let resultsView: JSX.Element;
    if (result.queryResultType = QueryResultType.WorkItem) {
        resultsView = <WiQueryResults workItems={workItems}/>;
    } else {
        resultsView = <div>{'TODO work item relations'}</div>;
    }
    ReactDom.render(resultsView, document.getElementById('query-results') as HTMLElement);
}

export function setError(error: TfsError | string) {
    const message = typeof error === 'string' ? error : (error.serverError || error)['message'];
    ReactDom.render(<div className={'error-message'}>{message}</div>, document.getElementById('query-results') as HTMLElement);
}

export function setMessage(message: string) {
    ReactDom.render(<div>{message}</div>, document.getElementById('query-results') as HTMLElement);
}