import { parse } from './wiqlParser';
import * as Symbols from './wiqlSymbols';
import { WorkItemField } from 'TFS/WorkItemTracking/Contracts';

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
    return `[${fields[field.identifier.text.toLocaleLowerCase()].name}]`;
}
function formatFieldList(fieldList: Symbols.FieldList, fields: FieldMap): string {
    const fieldStrs: string[] = [];
    let currFieldList: Symbols.FieldList | undefined = fieldList;
    while (currFieldList) {
        fieldStrs.push(formatField(currFieldList.field, fields));
        currFieldList = currFieldList.restOfList;
    }
    return fieldStrs.join(', ');
}
function formatNumber(num: Symbols.Number) {
    return (num.minus ? '-' : '') + num.digits.text;
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
            const opStr = value.operator instanceof Symbols.Minus ? ' - ' : ' + ';
            return value.value.text + opStr + formatNumber(value.num);
        } else {
            return value.value.text;
        }
    } else if (value.value instanceof Symbols.True) {
        return 'true';
    } else if (value.value instanceof Symbols.False) {
        return 'false';
    } else if (value.value instanceof Symbols.Field) {
        return formatField(value.value, fields);
    }
    throw new Error('Unkown value');
}
function formatValueList(valueList: Symbols.ValueList, fields: FieldMap): string {
    const valueStrs: string[] = [];
    let currValueList: Symbols.ValueList | undefined = valueList;
    while (currValueList) {
        valueStrs.push(formatValue(currValueList.value, fields));
        currValueList = currValueList.restOfList;
    }
    return valueStrs.join(', ');
}
function formatConditionalOperator(cond: Symbols.ConditionalOperator): string {
    if (cond.conditionToken instanceof Symbols.Equals) {
        return '=';
    } else if (cond.conditionToken instanceof Symbols.NotEquals) {
        return '<>';
    } else if (cond.conditionToken instanceof Symbols.GreaterThan) {
        return '>';
    } else if (cond.conditionToken instanceof Symbols.GreaterOrEq) {
        return '>=';
    } else if (cond.conditionToken instanceof Symbols.LessThan) {
        return '<';
    } else if (cond.conditionToken instanceof Symbols.LessOrEq) {
        return '<=';
    } else if (cond.conditionToken instanceof Symbols.Contains) {
        return (cond.not ? 'NOT ' : '') + 'CONTAINS';
    } else if (cond.conditionToken instanceof Symbols.ContainsWords) {
        return (cond.not ? 'NOT ' : '') + 'CONTAINS WORDS';
    } else if (cond.conditionToken instanceof Symbols.InGroup) {
        return (cond.not ? 'NOT ' : '') + 'IN GROUP';
    } else if (cond.conditionToken instanceof Symbols.Like) {
        return (cond.ever ? 'EVER ' : '') + (cond.not ? 'NOT ' : '') + 'LIKE';
    } else if (cond.conditionToken instanceof Symbols.Under) {
        return (cond.ever ? 'EVER ' : '') + (cond.not ? 'NOT ' : '') + 'UNDER';
    }
    throw new Error('Unexpected condtional operator');
}
function formatConditionalExpression(conditionalExpression: Symbols.ConditionalExpression, tab: string, indent: number, fields: FieldMap): string[] {
    if (conditionalExpression.expression) {
        return [
            tabs(tab, indent) + '(',
            ...formatLogicalExpression(conditionalExpression.expression, tab, indent + 1, fields),
            tabs(tab, indent) + ')',
        ];
    }
    if (conditionalExpression.field && conditionalExpression.valueList) {
        const op = conditionalExpression.not ? ' NOT IN ' : ' IN ';
        return [tabs(tab, indent) + formatField(conditionalExpression.field, fields) + op + '(' + formatValueList(conditionalExpression.valueList, fields) + ')'];
    }
    if (conditionalExpression.field && conditionalExpression.conditionalOperator && conditionalExpression.value) {
        return [`${tabs(tab, indent)}${formatField(conditionalExpression.field, fields)} ${formatConditionalOperator(conditionalExpression.conditionalOperator)} ${formatValue(conditionalExpression.value, fields)}`];
    }
    return [];
}
function formatLogicalExpression(logicalExpression: Symbols.LogicalExpression, tab: string, indent: number, fields: FieldMap): string[] {
    const lines: string[] = formatConditionalExpression(logicalExpression.condition, tab, indent, fields);
    if (logicalExpression.everNot instanceof Symbols.Ever) {
        lines[0] = insert(lines[0], 'EVER ');
    } else if (<Symbols.Not | undefined>logicalExpression.everNot instanceof Symbols.Not) {
        lines[0] = insert(lines[0], 'NOT ');
    }
    if (logicalExpression.orAnd && logicalExpression.expression) {
        const orAndStr = logicalExpression.orAnd instanceof Symbols.Or ? 'OR ' : 'AND ';
        const secondExpLines = formatLogicalExpression(logicalExpression.expression, tab, indent, fields);
        secondExpLines[0] = insert(secondExpLines[0], orAndStr);
        lines.push(...secondExpLines);
    }
    return lines;
}
function formatOrderByFieldList(orderBy: Symbols.OrderByFieldList, fields: FieldMap): string {
    let line = 'ORDER BY ';
    let orders: string[] = [];
    let currOrderBy: Symbols.OrderByFieldList | undefined = orderBy;
    while (currOrderBy) {
        const field = formatField(currOrderBy.field, fields);
        if (currOrderBy.ascDesc instanceof Symbols.Asc) {
            orders.push(field + ' ASC');
        } else if (<Symbols.Desc | undefined>currOrderBy.ascDesc instanceof Symbols.Desc) {
            orders.push(field + ' DESC');
        } else {
            orders.push(field);
        }
        currOrderBy = currOrderBy.restOfList;
    }
    return `ORDER BY ${orders.join(', ')}`;
}
function formatFlatSelect(flatSelect: Symbols.FlatSelect, tab: string, fields: FieldMap): string[] {
    const lines: string[] = [];
    lines.push('SELECT');
    lines.push(tab + formatFieldList(flatSelect.fieldList, fields));
    lines.push('FROM workitems');
    if (flatSelect.whereExp) {
        lines.push('WHERE');
        lines.push(...formatLogicalExpression(flatSelect.whereExp, tab, 1, fields));
    }
    if (flatSelect.orderBy) {
        lines.push(formatOrderByFieldList(flatSelect.orderBy, fields));
    }
    if (flatSelect.asOf) {
        lines.push('ASOF ' + flatSelect.asOf.dateString.text);
    }
    lines.push('');
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
    if (parseTree instanceof Symbols.FlatSelect) {
        const lines = formatFlatSelect(parseTree, tab, fieldMap);
        const edit = <monaco.editor.IIdentifiedSingleEditOperation>{
            text: lines.join('\r\n'),
            range: model.getFullModelRange(),
            forceMoveMarkers: true,
        };
        model.pushEditOperations(editor.getSelections(),[edit],
        // TODO actually calculate the new position 
        (edits) => [new monaco.Selection(1, 1, 1, 1)]);
        // model.pushStackElement();
    } else {
        // syntax error, not going to format
    }
}
