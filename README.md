# Coren TUI

![](https://img.shields.io/badge/stable-0.0.11-success?style=for-the-badge)
![](https://img.shields.io/badge/license-MIT-informational?style=for-the-badge)

A terminal-based, stack-based interpreter for [Coren](https://github.com/usefulmove/coren). Built with [Ink](https://github.com/vadimdemedes/ink) and React.

Coren is a high-level, reverse-Polish language reminiscent of Forth, inspired by the command interface of pioneering HP scientific calculators from the 1970s. This TUI version brings the same postfix evaluation to your terminal.

---

## Install

### From npm (coming soon)

```bash
npm install -g coren-tui
```

### From source

```bash
git clone https://github.com/usefulmove/coren-tui.git
cd coren-tui
npm install
npm run build
npm link        # or: npm install -g .
```

---

## Usage

```bash
coren
```

The interpreter starts with an empty stack. Enter postfix expressions line by line:

```
3 4 +      → stack: [7]
5 dup *    → stack: [7, 25]
swap -     → stack: [-18]
```

### Commands

| Command | Action |
|---------|--------|
| `q` | Quit (on empty input) |
| `cls` | Clear the stack |
| `cmds` | List available commands |

---

## Related

- [Coren (GUI)](https://github.com/usefulmove/coren) — The original web-based interpreter
- [coren.one](https://www.coren.one) — Try Coren online

---

## License

Available under the MIT License. See [`LICENSE`](./LICENSE) for the full text.
