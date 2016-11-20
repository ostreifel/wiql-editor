import {getClient as getWorkClient} from "TFS/WorkItemTracking/RestClient";
import {renderQueryResults, renderQueryError} from "./queryResults";

function search() {
    const wiqlText = $('.wiql-box').val();
    getWorkClient().queryByWiql({query: wiqlText}).then(renderQueryResults, renderQueryError);
}

$('.search-button').click(() => search());

// Register context menu action provider
VSS.register(VSS.getContribution().id, {});