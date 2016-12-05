import { parse } from './wiqlParser';
import * as Symbols from './wiqlSymbols';
import { WorkItemField } from 'TFS/WorkItemTracking/Contracts';

type FieldMap = { [name: string]: WorkItemField };
function formatField(field: Symbols.Field, fields: FieldMap): string {
    return `[${fields[field.identifier.value].name}]`;
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
function formatLogicalExpression(logicalExpression: Symbols.LogicalExpression, tab: string, indent: number, fields: FieldMap): string[] {
    const lines: string[] = [];
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
        lines.push(...formatLogicalExpression(flatSelect.whereExp, tab, 1, fields))
    }
    if (flatSelect.orderBy) {
        lines.push(formatOrderByFieldList(flatSelect.orderBy, fields));
    }
    if (flatSelect.asOf) {
        lines.push('ASOF ' + flatSelect.asOf.dateString.value);
    }
    return lines;
}

export function format(model: monaco.editor.IModel, fields: WorkItemField[]): void {
    const text = model.toRawText();
    const tab = text.options.insertSpaces ? Array(text.options.tabSize + 1).join(' ') : '\t';
    const fieldMap: FieldMap = {};
    for (let field of fields) {
        fieldMap[field.name.toLocaleLowerCase()] =
            fieldMap[field.referenceName.toLocaleLowerCase()] = field;
    }

    const parseTree = parse(text.lines);
    if (parseTree instanceof Symbols.FlatSelect) {
        text.lines = formatFlatSelect(parseTree, tab, fieldMap);
        model.setValueFromRawText(text);
    } else {
        // syntax error, not going to format
    }
}