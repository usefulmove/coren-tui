import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useRef, useEffect } from "react";
import { Box, Text, useInput, useApp } from "ink";
import { CorenInterpreter } from "./coren.js";
const VERSION = "ver. 0.0.11";
const FOOTER = "( Press q with empty input to quit. Enter 'cmds' to list commands and 'cls' to clear stack. )";
function InputLine({ value, onChange, onSubmit, onHistoryUp, onHistoryDown, onQuit, }) {
    useInput((input, key) => {
        if (key.return) {
            onSubmit(value);
            return;
        }
        if (key.upArrow) {
            onHistoryUp();
            return;
        }
        if (key.downArrow) {
            onHistoryDown();
            return;
        }
        if (key.leftArrow || key.rightArrow) {
            return; // ignore for now
        }
        if (key.delete || key.backspace) {
            onChange(value.slice(0, -1));
            return;
        }
        if (input === "q" && value === "" && !key.ctrl && !key.meta) {
            onQuit();
            return;
        }
        if (input.length > 0 && !key.ctrl && !key.meta) {
            onChange(value + input);
        }
    });
    return (_jsxs(Box, { children: [_jsx(Text, { color: "cyan", children: "exp: " }), _jsx(Text, { color: "yellowBright", children: value }), _jsx(Text, { color: "gray", children: "_".repeat(1) })] }));
}
function StackDisplay({ stack }) {
    if (stack.length === 0) {
        return (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: "gray", children: "( stack clear )" }) }));
    }
    const reversed = [...stack].reverse();
    return (_jsx(Box, { flexDirection: "column", marginTop: 1, children: reversed.map((item, idx) => {
            const isTop = idx === 0;
            return (_jsxs(Box, { children: [_jsxs(Text, { color: "blueBright", children: [idx + 1, ". "] }), _jsx(Text, { color: isTop ? "yellowBright" : "white", children: item })] }, idx));
        }) }));
}
function App() {
    const { exit } = useApp();
    const interpreterRef = useRef(new CorenInterpreter());
    const interpreter = interpreterRef.current;
    const [stack, setStack] = useState([]);
    const [output, setOutput] = useState("");
    const [input, setInput] = useState("");
    const [customCmds, setCustomCmds] = useState([]);
    const [history, setHistory] = useState([]);
    const [historyIdx, setHistoryIdx] = useState(-1);
    useEffect(() => {
        interpreter.setOutputFn((msg) => setOutput(msg));
    }, [interpreter]);
    const handleSubmit = useCallback((value) => {
        const trimmed = value.trim();
        if (trimmed === "")
            return;
        setHistory((prev) => [...prev, trimmed]);
        setHistoryIdx(-1);
        setOutput("");
        setInput("");
        const ops = interpreter.exprToOps(trimmed);
        const newStack = interpreter.evaluateOps(ops)(stack);
        setStack(newStack);
        setCustomCmds(interpreter.getUserCmdNames());
    }, [stack, interpreter]);
    const handleHistoryUp = useCallback(() => {
        if (historyIdx > 0) {
            const next = historyIdx - 1;
            setHistoryIdx(next);
            setInput(history[next]);
        }
        else if (historyIdx === 0) {
            setHistoryIdx(-1);
            setInput("");
        }
        else if (historyIdx === -1 && history.length > 0) {
            setHistoryIdx(history.length - 1);
            setInput(history[history.length - 1]);
        }
    }, [history, historyIdx]);
    const handleHistoryDown = useCallback(() => {
        if (historyIdx >= 0 && historyIdx < history.length - 1) {
            const next = historyIdx + 1;
            setHistoryIdx(next);
            setInput(history[next]);
        }
        else {
            setHistoryIdx(-1);
            setInput("");
        }
    }, [history, historyIdx]);
    return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsxs(Box, { children: [_jsx(Text, { color: "magentaBright", children: "Coren ( . . . )" }), _jsxs(Text, { color: "blue", children: ["  ( ", VERSION, " )"] })] }), _jsx(Box, { marginTop: 1, children: _jsx(InputLine, { value: input, onChange: setInput, onSubmit: handleSubmit, onHistoryUp: handleHistoryUp, onHistoryDown: handleHistoryDown, onQuit: exit }) }), output && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: "gray", children: output }) })), _jsx(StackDisplay, { stack: stack }), customCmds.length > 0 && (_jsxs(Box, { marginTop: 1, children: [_jsx(Text, { color: "blueBright", children: "custom: " }), customCmds.map((cmd, i) => (_jsxs(Text, { color: "magentaBright", children: [cmd, i < customCmds.length - 1 ? " " : ""] }, cmd)))] })), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: "blue", children: FOOTER }) })] }));
}
export default App;
