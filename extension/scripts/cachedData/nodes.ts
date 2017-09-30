import { CachedValue } from "./CachedValue";
import { getClient as getWitClient } from "TFS/WorkItemTracking/RestClient";
import { WorkItemClassificationNode, TreeStructureGroup } from "TFS/WorkItemTracking/Contracts";
import { projects } from "./projects";
import * as Q from "q";
import { TeamProjectReference } from "TFS/Core/Contracts";

export interface ProjectNodes {
    project: TeamProjectReference;
    iterationNode: WorkItemClassificationNode;
}
export const iterationNodesByProject: CachedValue<ProjectNodes[]> = new CachedValue(() => getTreeNodes(TreeStructureGroup.Iterations));
export const areaNodesByProject: CachedValue<ProjectNodes[]> = new CachedValue(() => getTreeNodes(TreeStructureGroup.Areas));
function getTreeNodes(type: TreeStructureGroup): Q.IPromise<ProjectNodes[]> {
    return projects.getValue().then((projs): Q.IPromise<ProjectNodes[]> => {
        const projPromises = projs.map((project): Q.IPromise<ProjectNodes> =>
            getWitClient().getClassificationNode(project.name, type, undefined, 2147483647).then(
                (iterationNode): ProjectNodes => ({project, iterationNode})
            )
        );
        return Q.all(projPromises);
    });
}

export const iterationStrings: CachedValue<string[]> = new CachedValue(() => getTreeStrings(iterationNodesByProject));
export const areaStrings: CachedValue<string[]> = new CachedValue(() => getTreeStrings(areaNodesByProject));
function getTreeStrings(nodes: CachedValue<ProjectNodes[]>) {
    interface QueuedNode {
        path: string;
        node: WorkItemClassificationNode;
    }
    return nodes.getValue().then(nodesByProj => {
        const paths: {[iteration: string]: void} = {};
        const toProcess: QueuedNode[] = [];
        for (const {iterationNode} of nodesByProj) {
            toProcess.push({path: iterationNode.name, node: iterationNode});
        }
        while (toProcess.length > 0) {
            const {path, node} = toProcess.pop() as QueuedNode;
            paths[path] = undefined;
            for (const child of node.children || []) {
                toProcess.push({
                    path: `${path}\\${child.name}`,
                    node: child
                });
            }
        }
        return Object.keys(paths);
    });
}
