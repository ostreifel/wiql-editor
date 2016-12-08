import { isSupportedQueryId, showDialog } from './wiqlDialog';

const menuAction = <IContributedMenuSource>{
    getMenuItems: (context): IContributedMenuItem | null => {
        if (!context || !context.query || !isSupportedQueryId(context.query.id)) {
            return null;
        }
        return [<IContributedMenuItem>{
            text: 'Edit query wiql',
            icon: 'img/smallLogo.png',
            action: function (actionContext) {
                showDialog(actionContext.query);
            }
        }];
    }
};

VSS.register(VSS.getContribution().id, menuAction);
