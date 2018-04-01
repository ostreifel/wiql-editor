import { FieldLookup, fieldsVal } from "../cachedData/fields";
import { parse } from "./compiler/parser";
import * as Symbols from "./compiler/symbols";

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
function formatField(field: Symbols.Field, fields: FieldLookup): string {
    const foundField = fields[field.identifier.text.toLocaleLowerCase()];
    return `[${foundField ? foundField.referenceName : field.identifier.text}]`;
}
function formatFieldList(fieldList: Symbols.FieldList, fields: FieldLookup, tab: string): string[] {
    const lines: string[] = [];
    let currFieldList: Symbols.FieldList | undefined = fieldList;
    while (currFieldList) {
        const comma = currFieldList.restOfList ? "," : "";
        lines.push(tab + formatField(currFieldList.field, fields) + comma);
        currFieldList = currFieldList.restOfList;
    }
    return lines;
}
function formatNumber(num: Symbols.Number) {
    return (num.minus ? "-" : "") + num.digits.text;
}
function formatVariable(exp: Symbols.VariableExpression) {
    let str = exp.name.text;
    if (exp.args) {
        str += "(";
        for (let args = exp.args; args; args = args.args) {
            const {value} = args;
            if (value instanceof Symbols.String) {
                str += value.text;
            } else if (value instanceof Symbols.Number) {
                str += formatNumber(value);
            } else if (value instanceof Symbols.True) {
                str += "true";
            } else if (value instanceof Symbols.False) {
                str += "false";
            }
            if (args.args) {
                str += ", ";
            }
        }
        str += ")";
    }
    if (exp.operator && exp.num) {
        const opStr = exp.operator instanceof Symbols.Minus ? " - " : " + ";
        str += opStr + formatNumber(exp.num);
    }
    return str;
}
function formatValue({value}: Symbols.Value, fields: FieldLookup): string {
    if (value instanceof Symbols.Number) {
        return formatNumber(value);
    } else if (value instanceof Symbols.String) {
        return value.text;
    } else if (value instanceof Symbols.DateTime) {
        return value.dateString.text;
    } else if (value instanceof Symbols.VariableExpression) {
        return formatVariable(value);
    } else if (value instanceof Symbols.True) {
        return "true";
    } else if (value instanceof Symbols.False) {
        return "false";
    } else if (value instanceof Symbols.Field) {
        return formatField(value, fields);
    }
    throw new Error("Format Error: Unkown value: " + value);
}
function formatValueList(valueList: Symbols.ValueList, fields: FieldLookup): string {
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
    } else if (cond.conditionToken instanceof Symbols.Ever) {
        return "EVER";
    }
    throw new Error("Unexpected conditional operator");
}
function formatCondition(condition: Symbols.ConditionalExpression | Symbols.LinkCondition,
                         tab: string, indent: number, fields: FieldLookup): string[] {
    if (condition.expression) {
        return [
            tabs(tab, indent) + "(",
            ...formatExpression(condition.expression, tab, indent + 1, fields),
            tabs(tab, indent) + ")",
        ];
    }
    let prefix = "";
    if (condition instanceof Symbols.LinkCondition) {
        if (condition.prefix instanceof Symbols.TargetPrefix) {
            prefix = "[Target].";
        } else if (condition.prefix instanceof Symbols.SourcePrefix) {
            prefix = "[Source].";
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
                          tab: string, indent: number, fields: FieldLookup): string[] {
    const lines: string[] = formatCondition(logicalExpression.condition, tab, indent, fields);
    if (logicalExpression.everNot instanceof Symbols.Ever) {
        lines[0] = insert(lines[0], "EVER ");
    } else if (<Symbols.Not | undefined> logicalExpression.everNot instanceof Symbols.Not) {
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
                                fields: FieldLookup, tab: string): string[] {
    const lines: string[] = [];
    let currOrderBy: Symbols.OrderByFieldList | Symbols.LinkOrderByFieldList | undefined = orderBy;
    while (currOrderBy) {
        const field = formatField(currOrderBy.field, fields);
        let order: string = "";
        if (currOrderBy.ascDesc instanceof Symbols.Asc) {
            order = " ASC";
        } else if (<Symbols.Desc | undefined> currOrderBy.ascDesc instanceof Symbols.Desc) {
            order = " DESC";
        }
        let prefix: string = "";
        if (currOrderBy instanceof Symbols.LinkOrderByFieldList) {
            if (currOrderBy.prefix instanceof Symbols.Source) {
                prefix = "[Source].";
            } else if (currOrderBy.prefix instanceof Symbols.Target) {
                prefix = "[Target].";
            }
        }
        let line = prefix + field + order;
        if (currOrderBy === orderBy) {
            line = "ORDER BY " + line;
        } else {
            line = tab + line;
        }
        if (currOrderBy.restOfList) {
            line += ",";
        }
        lines.push(line);
        currOrderBy = currOrderBy.restOfList;
    }
    return lines;
}
function formatSelect(select: Symbols.FlatSelect | Symbols.OneHopSelect | Symbols.RecursiveSelect,
                      tab: string,
                      fields: FieldLookup): string[] {
    const lines: string[] = [];
    lines.push("SELECT");
    lines.push(...formatFieldList(select.fieldList, fields, tab));
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
        lines.push(...formatOrderByFieldList(select.orderBy, fields, tab));
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

function formatSync(editor: monaco.editor.IStandaloneCodeEditor, fieldLookup: FieldLookup) {
    const model = editor.getModel();
    const tab = model.getOneIndent();

    const parseTree = parse(model.getLinesContent());
    let lines: string[];
    if (parseTree instanceof Symbols.FlatSelect ||
        parseTree instanceof Symbols.OneHopSelect ||
        parseTree instanceof Symbols.RecursiveSelect) {
        lines = formatSelect(parseTree, tab, fieldLookup);
    } else {
        // syntax error, not going to format
        return;
    }
    const edit = <monaco.editor.IIdentifiedSingleEditOperation> {
        text: lines.join("\r\n"),
        range: model.getFullModelRange(),
        forceMoveMarkers: true,
    };
    model.pushEditOperations(editor.getSelections(), [edit],
        // TODO actually calculate the new position
        (edits) => [new monaco.Selection(1, 1, 1, 1)]);
}

export async function format(editor: monaco.editor.IStandaloneCodeEditor) {
    // Don't wait for fields but use if available
    if (fieldsVal.isLoaded()) {
        const fields = await fieldsVal.getValue();
        formatSync(editor, fields);
    } else {
        formatSync(editor, new FieldLookup([]));
        // Queue fields get now;
        fieldsVal.getValue();
    }
}
