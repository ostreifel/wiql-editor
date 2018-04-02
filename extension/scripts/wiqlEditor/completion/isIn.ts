import * as Symbols from "../compiler/symbols";
import { ICompletionContext } from "./completionContext";

export function isInsideString(ctx: ICompletionContext) {
    return ctx.parseNext.errorToken instanceof Symbols.NonterminatingString;
}

export interface IVariableContext {
    name: string;
    /** Null if not in arguments */
    args?: Symbols.Symbol[];
}

export function isInVariable(ctx: ICompletionContext): IVariableContext | null {
    let context: IVariableContext | null = null;
    for (const token of ctx.parsedTokens) {
        if (token instanceof Symbols.Variable) {
            context = { name: token.text };
        } else if (context && token instanceof Symbols.LParen) {
            context.args = [];
        } else if (context && context.args && !(token instanceof Symbols.Comma)) {
            context.args.push(token);
        }
    }
    return context;
}
