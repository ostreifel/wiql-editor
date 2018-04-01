import { trackEvent } from "../events";
import { showDialog } from "../queryEditor/queryDialog";
import { IQuery } from "./contextContracts";

trackEvent("pageLoad");
const menuAction: Partial<IContributedMenuSource> = {
    getMenuItems: (context: {query: IQuery}): IContributedMenuItem[] => {
        if (!context || !context.query) {
            return [];
        }
        return [<IContributedMenuItem> {
            text: "Edit query wiql",
            icon: "img/smallLogo.png",
            action: (actionContext) => {
                showDialog(actionContext.query);
            },
        }];
    },
};

const extensionContext = VSS.getExtensionContext();
VSS.register(`${extensionContext.publisherId}.${extensionContext.extensionId}.query-menu`, menuAction);
VSS.register(`${extensionContext.publisherId}.${extensionContext.extensionId}.query-results-menu`, menuAction);
