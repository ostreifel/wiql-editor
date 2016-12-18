import { isSupportedQueryId, showDialog } from "./wiqlDialog";

const menuAction: Partial<IContributedMenuSource> = {
    getMenuItems: (context): IContributedMenuItem[] => {
        if (!context || !context.query || !isSupportedQueryId(context.query.id)) {
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

VSS.register(VSS.getContribution().id, menuAction);
