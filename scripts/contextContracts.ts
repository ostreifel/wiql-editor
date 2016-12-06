export interface IQuery {
    id: string;
    name: string;
    isPublic: boolean;
    wiql: string;
    path: string;
}
export interface IContextOptions {
    query: IQuery;
    /** To be set by consumer and read by provider*/
    okCallback: () => void;
    /** Not set until after dialog created */
    updateSaveButton: (enabled: boolean) => void;
}
