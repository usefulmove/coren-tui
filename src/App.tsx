import React, { useState, useCallback, useRef, useEffect } from "react";
import { Box, Text, useInput, useApp } from "ink";
import { CorenInterpreter, HELP_TEXT } from "./coren.js";

const VERSION = "ver. 0.0.11";
const FOOTER = "( Press q with empty input to quit. Enter 'cmds' to list commands and 'cls' to clear stack. )";

function InputLine({
  value,
  onChange,
  onSubmit,
  onHistoryUp,
  onHistoryDown,
  onQuit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
  onHistoryUp: () => void;
  onHistoryDown: () => void;
  onQuit: () => void;
}) {
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

  return (
    <Box>
      <Text color="cyan">exp: </Text>
      <Text color="yellowBright">{value}</Text>
      <Text color="gray">{"_".repeat(1)}</Text>
    </Box>
  );
}

function StackDisplay({ stack }: { stack: string[] }) {
  if (stack.length === 0) {
    return (
      <Box marginTop={1}>
        <Text color="gray">( stack clear )</Text>
      </Box>
    );
  }

  const reversed = [...stack].reverse();
  return (
    <Box flexDirection="column" marginTop={1}>
      {reversed.map((item, idx) => {
        const isTop = idx === 0;
        return (
          <Box key={idx}>
            <Text color="blueBright">{idx + 1}. </Text>
            <Text color={isTop ? "yellowBright" : "white"}>{item}</Text>
          </Box>
        );
      })}
    </Box>
  );
}

function App() {
  const { exit } = useApp();

  const interpreterRef = useRef(new CorenInterpreter());
  const interpreter = interpreterRef.current;

  const [stack, setStack] = useState<string[]>([]);
  const [output, setOutput] = useState("");
  const [input, setInput] = useState("");
  const [customCmds, setCustomCmds] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  useEffect(() => {
    interpreter.setOutputFn((msg: string) => setOutput(msg));
  }, [interpreter]);

  const handleSubmit = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed === "") return;

      setHistory((prev) => [...prev, trimmed]);
      setHistoryIdx(-1);
      setOutput("");
      setInput("");

      const ops = interpreter.exprToOps(trimmed);
      const newStack = interpreter.evaluateOps(ops)(stack);
      setStack(newStack);
      setCustomCmds(interpreter.getUserCmdNames());
    },
    [stack, interpreter],
  );

  const handleHistoryUp = useCallback(() => {
    if (historyIdx > 0) {
      const next = historyIdx - 1;
      setHistoryIdx(next);
      setInput(history[next]);
    } else if (historyIdx === 0) {
      setHistoryIdx(-1);
      setInput("");
    } else if (historyIdx === -1 && history.length > 0) {
      setHistoryIdx(history.length - 1);
      setInput(history[history.length - 1]);
    }
  }, [history, historyIdx]);

  const handleHistoryDown = useCallback(() => {
    if (historyIdx >= 0 && historyIdx < history.length - 1) {
      const next = historyIdx + 1;
      setHistoryIdx(next);
      setInput(history[next]);
    } else {
      setHistoryIdx(-1);
      setInput("");
    }
  }, [history, historyIdx]);

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box>
        <Text color="magentaBright">Coren ( . . . )</Text>
        <Text color="blue">  ( {VERSION} )</Text>
      </Box>

      {/* Input */}
      <Box marginTop={1}>
        <InputLine
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          onHistoryUp={handleHistoryUp}
          onHistoryDown={handleHistoryDown}
          onQuit={exit}
        />
      </Box>

      {/* Output text */}
      {output && (
        <Box marginTop={1}>
          <Text color="gray">{output}</Text>
        </Box>
      )}

      {/* Stack */}
      <StackDisplay stack={stack} />

      {/* Custom commands */}
      {customCmds.length > 0 && (
        <Box marginTop={1}>
          <Text color="blueBright">custom: </Text>
          {customCmds.map((cmd, i) => (
            <Text key={cmd} color="magentaBright">
              {cmd}{i < customCmds.length - 1 ? " " : ""}
            </Text>
          ))}
        </Box>
      )}

      {/* Footer */}
      <Box marginTop={1}>
        <Text color="blue">{FOOTER}</Text>
      </Box>
    </Box>
  );
}

export default App;
