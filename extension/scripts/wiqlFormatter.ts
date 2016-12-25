import { parse } from "./compiler/wiqlParser";
import * as Symbols from "./compiler/wiqlSymbols";
import { WorkItemField } from "TFS/WorkItemTracking/Contracts";

type FieldMap = { [name: string]: WorkItemField };

function insert(line: string, text: string) {
    const match = line.match(/(\s*)(.*)/);
    if (match) {
        return match[1] + text + match[2];
    }
    return line;
}
function tabs(tab: string, indent: number) {
    return Array(indent + 1).join(tab);
}
function formatField(field: Symbols.Field, fields: FieldMap): string {
    const foundField = fields[field.identifier.text.toLocaleLowerCase()];
    return `[${foundField ? foundField.name : field.identifier.text}]`;
}
function formatFieldList(fieldList: Symbols.FieldList, fields: FieldMap): string {
    const fieldStrs: string[] = [];
    let currFieldList: Symbols.FieldList | undefined = fieldList;
    while (currFieldList) {
        fieldStrs.push(formatField(currFieldList.field, fields));
        currFieldList = currFieldList.restOfList;
    }
    return fieldStrs.join(", ");
}
function formatNumber(num: Symbols.Number) {
    return (num.minus ? "-" : "") + num.digits.text;
}
function formatValue(value: Symbols.Value, fields: FieldMap): string {
    if (value.value instanceof Symbols.Number) {
        return formatNumber(value.value);
    } else if (value.value instanceof Symbols.String) {
        return value.value.text;
    } else if (value.value instanceof Symbols.DateTime) {
        return value.value.dateString.text;
    } else if (value.value instanceof Symbols.Variable) {
        if (value.operator && value.num) {
            const opStr = value.operator instanceof Symbols.Minus ? " - " : " + ";
            return value.value.text + opStr + formatNumber(value.num);
        } else {
            return value.value.text;
        }
    } else if (value.value instanceof Symbols.True) {
        return "true";
    } else if (value.value instanceof Symbols.False) {
        return "false";
    } else if (value.value instanceof Symbols.Field) {
        return formatField(value.value, fields);
    }
    throw new Error("Unkown value");
}
function formatValueList(valueList: Symbols.ValueList, fields: FieldMap): string {
    const valueStrs: string[] = [];
    let currValueList: Symbols.ValueList | undefined = valueList;
    while (currValueList) {
        valueStrs.push(formatValue(currValueList.value, fields));
        currValueList = currValueList.restOfList;
    }
    return valueStrs.join(", ");
}
function formatConditionalOperator(cond: Symbols.ConditionalOperator): string {
    if (cond.conditionToken instanceof Symbols.Equals) {
        return "=";
    } else if (cond.conditionToken instanceof Symbols.NotEquals) {
        return "<>";
    } else if (cond.conditionToken instanceof Symbols.GreaterThan) {
        return ">";
    } else if (cond.conditionToken instanceof Symbols.GreaterOrEq) {
        return ">=";
    } else if (cond.conditionToken instanceof Symbols.LessThan) {
        return "<";
    } else if (cond.conditionToken instanceof Symbols.LessOrEq) {
        return "<=";
    } else if (cond.conditionToken instanceof Symbols.Contains) {
        return (cond.not ? "NOT " : "") + "CONTAINS";
    } else if (cond.conditionToken instanceof Symbols.ContainsWords) {
        return (cond.not ? "NOT " : "") + "CONTAINS WORDS";
    } else if (cond.conditionToken instanceof Symbols.InGroup) {
        return (cond.not ? "NOT " : "") + "IN GROUP";
    } else if (cond.conditionToken instanceof Symbols.Like) {
        return (cond.ever ? "EVER " : "") + (cond.not ? "NOT " : "") + "LIKE";
    } else if (cond.conditionToken instanceof Symbols.Under) {
        return (cond.ever ? "EVER " : "") + (cond.not ? "NOT " : "") + "UNDER";
    }
    throw new Error("Unexpected condtional operator");
}
function formatCondition(condition: Symbols.ConditionalExpression | Symbols.LinkCondition,
                         tab: string, indent: number, fields: FieldMap): string[] {
    if (condition.expression) {
        return [
            tabs(tab, indent) + "(",
            ...formatExpression(condition.expression, tab, indent + 1, fields),
            tabs(tab, indent) + ")",
        ];
    }
    let prefix = "";
    if (condition instanceof Symbols.LinkCondition) {
        if (condition.prefix instanceof Symbols.Target) {
            prefix = "[target].";
        } else if (condition.prefix instanceof Symbols.Source) {
            prefix = "[source].";
        }
    }
    if (condition.field && condition.valueList) {
        const op = condition.not ? " NOT IN " : " IN ";
        return [tabs(tab, indent) + prefix + formatField(condition.field, fields) + op + "(" + formatValueList(condition.valueList, fields) + ")"];
    }
    if (condition.field && condition.conditionalOperator && condition.value) {
        return [`${tabs(tab, indent)}${prefix}${formatField(condition.field, fields)} ${formatConditionalOperator(condition.conditionalOperator)} ${formatValue(condition.value, fields)}`];
    }
    return [];
}
function formatExpression(logicalExpression: Symbols.LogicalExpression | Symbols.LinkExpression,
                          tab: string, indent: number, fields: FieldMap): string[] {
    const lines: string[] = formatCondition(logicalExpression.condition, tab, indent, fields);
    if (logicalExpression.everNot instanceof Symbols.Ever) {
        lines[0] = insert(lines[0], "EVER ");
    } else if (<Symbols.Not | undefined>logicalExpression.everNot instanceof Symbols.Not) {
        lines[0] = insert(lines[0], "NOT ");
    }
    if (logicalExpression.orAnd && logicalExpression.expression) {
        const orAndStr = logicalExpression.orAnd instanceof Symbols.Or ? "OR " : "AND ";
        const secondExpLines = formatExpression(logicalExpression.expression, tab, indent, fields);
        secondExpLines[0] = insert(secondExpLines[0], orAndStr);
        lines.push(...secondExpLines);
    }
    return lines;
}
function formatOrderByFieldList(orderBy: Symbols.OrderByFieldList | Symbols.LinkOrderByFieldList,
                                fields: FieldMap): string {
    let line = "ORDER BY ";
    let orders: string[] = [];
    let currOrderBy: Symbols.OrderByFieldList | Symbols.LinkOrderByFieldList | undefined = orderBy;
    while (currOrderBy) {
        const field = formatField(currOrderBy.field, fields);
        let order: string = "";
        if (currOrderBy.ascDesc instanceof Symbols.Asc) {
            order = " ASC";
        } else if (<Symbols.Desc | undefined>currOrderBy.ascDesc instanceof Symbols.Desc) {
            order = " DESC";
        }
        let prefix: string = "";
        if (currOrderBy instanceof Symbols.LinkOrderByFieldList) {
            if (currOrderBy.prefix instanceof Symbols.Source) {
                prefix = "[source].";
            } else if (currOrderBy.prefix instanceof Symbols.Target) {
                prefix = "[target].";
            }
        }
        orders.push(prefix + field + order);
        currOrderBy = currOrderBy.restOfList;
    }
    return `ORDER BY ${orders.join(", ")}`;
}
function formatSelect(select: Symbols.FlatSelect | Symbols.OneHopSelect | Symbols.RecursiveSelect,
                      tab: string,
                      fields: FieldMap): string[] {
    const lines: string[] = [];
    lines.push("SELECT");
    lines.push(tab + formatFieldList(select.fieldList, fields));
    if (select instanceof Symbols.FlatSelect) {
        lines.push("FROM workitems");
    } else {
        lines.push("FROM workitemLinks");
    }
    if (select.whereExp) {
        lines.push("WHERE");
        lines.push(...formatExpression(select.whereExp, tab, 1, fields));
    }
    if (select.orderBy) {
        lines.push(formatOrderByFieldList(select.orderBy, fields));
    }
    if (select.asOf) {
        lines.push("ASOF " + select.asOf.dateString.text);
    }
    if (select instanceof Symbols.OneHopSelect && select.mode) {
        let modeStr: string;
        if (select.mode instanceof Symbols.MustContain) {
            modeStr = "MustContain";
        } else if (select.mode instanceof Symbols.MayContain) {
            modeStr = "MayContain";
        } else if (select.mode instanceof Symbols.DoesNotContain) {
            modeStr = "DoesNotContain";
        } else {
            throw new Error("Unknown mode");
        }
        lines.push(`MODE (${modeStr})`);
    }
    if (select instanceof Symbols.RecursiveSelect) {
        const modes: string[] = [];
        if (select.recursive) {
            modes.push("Recursive");
        }
        if (select.matchingChildren) {
            modes.push("ReturnMatchingChildren");
        }
        if (modes.length > 0) {
            lines.push(`MODE (${modes.join(", ")})`);
        }
    }
    lines.push("");
    return lines;
}

export function format(editor: monaco.editor.IStandaloneCodeEditor, fields: WorkItemField[]): void {
    const model = editor.getModel();
    const tab = model.getOneIndent();
    const fieldMap: FieldMap = {};
    for (let field of fields) {
        fieldMap[field.name.toLocaleLowerCase()] =
            fieldMap[field.referenceName.toLocaleLowerCase()] = field;
    }

    const parseTree = parse(model.getLinesContent());
    let lines: string[];
    if (parseTree instanceof Symbols.FlatSelect ||
        parseTree instanceof Symbols.OneHopSelect ||
        parseTree instanceof Symbols.RecursiveSelect) {
        lines = formatSelect(parseTree, tab, fieldMap);
    } else {
        // syntax error, not going to format
        return;
    }
    const edit = <monaco.editor.IIdentifiedSingleEditOperation>{
        text: lines.join("\r\n"),
        range: model.getFullModelRange(),
        forceMoveMarkers: true,
    };
    model.pushEditOperations(editor.getSelections(), [edit],
        // TODO actually calculate the new position 
        (edits) => [new monaco.Selection(1, 1, 1, 1)]);

}
