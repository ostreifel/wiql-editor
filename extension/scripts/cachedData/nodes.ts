import { TeamProjectReference } from "TFS/Core/Contracts";
import { TreeStructureGroup, WorkItemClassificationNode } from "TFS/WorkItemTracking/Contracts";
import { getClient as getWitClient } from "TFS/WorkItemTracking/RestClient";

import { CachedValue } from "./CachedValue";
import { projectsVal } from "./projects";

export interface IProjectNodes {
    project: TeamProjectReference;
    iterationNode: WorkItemClassificationNode;
}
export const iterationNodesByProject: CachedValue<IProjectNodes[]> = new CachedValue(() => getTreeNodes(TreeStructureGroup.Iterations));
export const areaNodesByProject: CachedValue<IProjectNodes[]> = new CachedValue(() => getTreeNodes(TreeStructureGroup.Areas));
async function getTreeNodes(type: TreeStructureGroup): Promise<IProjectNodes[]> {
    const projs = await projectsVal.getValue();
    const projPromises = projs.map(async (project): Promise<IProjectNodes> =>
        getWitClient().getClassificationNode(project.name, type, undefined, 2147483647).then(
            (iterationNode): IProjectNodes => ({project, iterationNode}),
        ),
    );
    return Promise.all(projPromises);
}

export const iterationStrings: CachedValue<string[]> = new CachedValue(() => getTreeStrings(iterationNodesByProject));
export const areaStrings: CachedValue<string[]> = new CachedValue(() => getTreeStrings(areaNodesByProject));
async function getTreeStrings(nodes: CachedValue<IProjectNodes[]>) {
    interface IQueuedNode {
        path: string;
        node: WorkItemClassificationNode;
    }
    return nodes.getValue().then((nodesByProj) => {
        const paths: {[iteration: string]: void} = {};
        const toProcess: IQueuedNode[] = [];
        for (const {iterationNode} of nodesByProj) {
            toProcess.push({path: iterationNode.name, node: iterationNode});
        }
        while (toProcess.length > 0) {
            const {path, node} = toProcess.pop() as IQueuedNode;
            paths[path] = undefined;
            for (const child of node.children || []) {
                toProcess.push({
                    path: `${path}\\${child.name}`,
                    node: child,
                });
            }
        }
        return Object.keys(paths);
    });
}
