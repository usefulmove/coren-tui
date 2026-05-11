# Coren TUI — Full Interpreter Port

## What was built

A terminal UI version of https://coren.one/ using **Ink 5** and **React 18**.

### Architecture

| File | Responsibility |
|------|----------------|
| `src/coren.ts` | Full Coren interpreter — 74 built-in commands, user-defined functions, lambda/map/fold/reduce, stack ops |
| `src/App.tsx` | Ink TUI — Header, InputLine (with `useInput`), StackDisplay, Output, Custom commands, Footer |
| `src/cli.tsx` | Entry point — `render(<App />)` |

### Key Features

- **Postfix (RPN) evaluation** — Every expression is evaluated left-to-right against a persistent stack
- **74 built-in commands** — Math, trig, conversions, base/ASCII, bitwise, stack manipulation, aggregates, RGB utilities
- **User-defined functions** — `( name ... )` syntax + `store` command
- **Lambda + higher-order** — `_` lambda operator with `map`, `fold`, `reduce`
- **History navigation** — Up/Down arrows cycle through previous expressions
- **Output channel** — `help`, `cmds`, `magic8` write to a text output area
- **Quit** — Press `q` on empty input to exit

### Verified Commands

All major categories tested:
- Arithmetic: `+`, `-`, `x`, `/`, `%`, `^`, `min`, `max`, `gcd`, `nroot`, `logn`
- Unary: `abs`, `chs`, `floor`, `ceil`, `inv`, `ln`, `log`, `log2`, `rand`, `round`, `sgn`, `sqrt`, `tng`, `!`
- Trig: `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `deg_rad`, `rad_deg`
- Conversions: `c_f`, `f_c`, `mi_km`, `km_mi`, `m_ft`, `ft_m`
- Bitwise: `and`, `nand`, `nor`, `not`, `ones`, `or`, `xor`, `xnor`, `>>`, `<<`
- Base/ASCII: `dec_hex`, `hex_dec`, `dec_bin`, `bin_dec`, `dec_oct`, `oct_dec`, `hex_bin`, `bin_hex`, `dec_ascii`, `ascii_dec`
- Stack: `cls`, `drop`, `dropn`, `dup`, `rev`, `reverse`, `roll`, `rolln`, `rot`, `rotn`, `swap`, `head`, `tail`, `init`, `last`, `taken`
- Aggregates: `sum`, `prod`, `mean`, `io`, `to`
- RGB: `rgb_code`, `code_rgb`, `rgb_x`, `code_x`, `code_avg`
- User functions: `store`, `(`, `)`, `_`, `map`, `fold`, `reduce`
- Meta: `pi`, `e`, `magic8`, `cmds`, `help`, `proot`

### How to run

```bash
npm install
npm run build
npm start        # or: node dist/cli.js
```

### Notes

- Requires a TTY (interactive terminal). `script` or `unbuffer` can wrap it in pipelines.
- `NodeNext` module resolution used for full ESM compatibility with Ink.
- Interpreter state is isolated per `CorenInterpreter` instance (via `useRef`).
