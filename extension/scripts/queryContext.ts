import { isSupportedQueryId, showDialog } from "./queryDialog";
import { IQuery } from "./contextContracts";

const menuAction: Partial<IContributedMenuSource> = {
    getMenuItems: (context: {query: IQuery}): IContributedMenuItem[] => {
        if (!context || !context.query) {
            return [];
        }
        return [<IContributedMenuItem>{
            text: "Edit query wiql",
            icon: "img/smallLogo.png",
            action: function (actionContext) {
                showDialog(actionContext.query);
            }
        }];
    }
};

const extensionContext = VSS.getExtensionContext();
VSS.register(`${extensionContext.publisherId}.${extensionContext.extensionId}.query-menu`, menuAction);
VSS.register(`${extensionContext.publisherId}.${extensionContext.extensionId}.query-results-menu`, menuAction);
