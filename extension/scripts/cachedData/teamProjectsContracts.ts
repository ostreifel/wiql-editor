import { FieldType } from "TFS/WorkItemTracking/ProcessContracts";
export interface ITeamProjects {
    projects: ITeamProject[];
    fields: ITeamField[];
}
export interface ITeamProject {
    id: number;
    name: string;
    guid: string;
    workItemTypes: string[];
    fieldIds: number[];
    process: ITeamProcess;
    useTextControlForIdentityFields: boolean;
}
export interface ITeamProcess {
    id: string;
    name: string;
    isInherited: boolean;
    isSystem: boolean;
    canEditProcess: boolean;
}
export interface ITeamField {
    id: number;
    name: string;
    referenceName: string;
    type: FieldType;
    flags: number;
    usages: number;
    isIdentity: boolean;
    isHistoryEnabled: boolean;
}