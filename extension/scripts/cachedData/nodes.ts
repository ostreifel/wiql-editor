import { CachedValue } from "./CachedValue";
import { getClient as getWitClient } from "TFS/WorkItemTracking/RestClient";
import { WorkItemClassificationNode, TreeStructureGroup } from "TFS/WorkItemTracking/Contracts";
import { projectsVal } from "./projects";
import { TeamProjectReference } from "TFS/Core/Contracts";

export interface ProjectNodes {
    project: TeamProjectReference;
    iterationNode: WorkItemClassificationNode;
}
export const iterationNodesByProject: CachedValue<ProjectNodes[]> = new CachedValue(() => getTreeNodes(TreeStructureGroup.Iterations));
export const areaNodesByProject: CachedValue<ProjectNodes[]> = new CachedValue(() => getTreeNodes(TreeStructureGroup.Areas));
async function getTreeNodes(type: TreeStructureGroup): Promise<ProjectNodes[]> {
    const projs = await projectsVal.getValue();
    const projPromises = projs.map(async (project): Promise<ProjectNodes> =>
        getWitClient().getClassificationNode(project.name, type, undefined, 2147483647).then(
            (iterationNode): ProjectNodes => ({project, iterationNode})
        )
    );
    return Promise.all(projPromises);
}

export const iterationStrings: CachedValue<string[]> = new CachedValue(() => getTreeStrings(iterationNodesByProject));
export const areaStrings: CachedValue<string[]> = new CachedValue(() => getTreeStrings(areaNodesByProject));
async function getTreeStrings(nodes: CachedValue<ProjectNodes[]>) {
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
