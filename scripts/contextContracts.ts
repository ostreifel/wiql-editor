export interface IQuery {
    id: string;
    name: string;
    isPublic: boolean;
    wiql: string;
    path: string;
}
export interface IContextOptions {
    query: IQuery;
}

export interface ICallbacks {
    /** To be set by consumer and read by provider*/
    okCallback: () => void;
    /** Not set until after dialog created */
    setUpdateSaveButton: (callback: (enabled: boolean) => void) => void;

}
