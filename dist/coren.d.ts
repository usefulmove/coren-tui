/**
 * Coren Interpreter — TypeScript port of coren.one
 * Postfix (RPN) stack-based command interpreter
 */
export type OutputFn = (msg: string) => void;
export declare class CorenInterpreter {
    private cmdfns;
    private userCmdOps;
    private loadingUserFunction;
    private setOutput;
    private lambdaOp;
    private userfnStart;
    private userfnEnd;
    private loadState;
    private magic8;
    constructor();
    setOutputFn(fn: OutputFn): void;
    getUserCmdNames(): string[];
    exprToOps(expr: string): string[];
    evaluateOps(ops: string[]): (stack: string[]) => string[];
    private handleOperation;
    private loadUserFunction;
    private unary;
    private binary;
    private registerCommands;
}
export declare const HELP_TEXT = "Coren is a command interpreter that takes a list of postfix operations and\nexecutes them to return the result (for example, '3 2 x' multiplies 3 and 2).\nThe available commands can be displayed by entering \"cmds\".\n";
export declare const interpreter: CorenInterpreter;
