import {getClient as getWorkClient} from "TFS/WorkItemTracking/RestClient";

function search() {
    const wiqlText = $('.wiql-box').val();
    getWorkClient().queryByWiql({query: wiqlText}).then((queryResult) => {
        $('.json-results').text(JSON.stringify(queryResult, null, 2));
    }, (error) => {
        $('.json-results').text(JSON.stringify(error, null, 2));
    })

}

$('.search-button').click(() => search());

// Register context menu action provider
VSS.register(VSS.getContribution().id, {});