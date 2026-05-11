/**
 * Coren Interpreter — TypeScript port of coren.one
 * Postfix (RPN) stack-based command interpreter
 */

// ─── Stack Primitives ───

const last = (arr: string[]): string | undefined => arr[arr.length - 1];
const init = (arr: string[]): string[] => arr.slice(0, -1);
const head = (arr: string[]): string | undefined => arr[0];
const tail = (arr: string[]): string[] => arr.slice(1);
const reverse = (arr: string[]): string[] => [...arr].reverse();
const take = (n: number) => (arr: string[]): string[] => arr.slice(0, n);
const drop = (n: number) => (arr: string[]): string[] => arr.slice(n);
const takeLast = (n: number) => (arr: string[]): string[] => arr.slice(-n);
const dropLast = (n: number) => (arr: string[]): string[] => arr.slice(0, -n);

/** Parse top element and return [rest, parsed] */
const popParse = (stack: string[]): [string[], number] => {
  const val = parseFloat(last(stack) ?? "0");
  return [init(stack), val];
};

/** Parse top 2 elements and return [rest, second, first] */
const popParse2 = (stack: string[]): [string[], number, number] => {
  const [s1, a] = popParse(stack);
  const [s2, b] = popParse(s1);
  return [s2, b, a];
};

/** Parse top 3 elements and return [rest, third, second, first] */
const popParse3 = (stack: string[]): [string[], number, number, number] => {
  const [s1, a] = popParse(stack);
  const [s2, b] = popParse(s1);
  const [s3, c] = popParse(s2);
  return [s3, c, b, a];
};

/** Parse top 4 elements and return [rest, fourth, third, second, first] */
const popParse4 = (stack: string[]): [string[], number, number, number, number] => {
  const [s1, a] = popParse(stack);
  const [s2, b] = popParse(s1);
  const [s3, c] = popParse(s2);
  const [s4, d] = popParse(s3);
  return [s4, d, c, b, a];
};

/** Generate range [start, end] with step */
const unfoldRange = (start: number, end: number, step: number): number[] => {
  const absStep = Math.abs(step) || 1;
  const result: number[] = [];
  if (end > start) {
    for (let i = start; i <= end; i += absStep) result.push(i);
  } else {
    for (let i = start; i >= end; i -= absStep) result.push(i);
  }
  return result;
};

/** Generate [1..n] */
const iota = (n: number): number[] => {
  const result: number[] = [];
  for (let i = 1; i <= n; i++) result.push(i);
  return result;
};

// ─── RGB Helpers ───

const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
const toHexByte = (n: number) => {
  const h = clamp255(n).toString(16);
  return h.length === 1 ? "0" + h : h;
};
const parseHex = (hex: string): number[] => {
  const clean = hex.startsWith("#") ? hex.slice(1) : hex;
  const pairs = clean.match(/.{2}/g) || [];
  return pairs.map((p) => parseInt(p, 16));
};
const rgbToHex = (r: number, g: number, b: number) => `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`;

// ─── Interpreter ───

export type OutputFn = (msg: string) => void;

export class CorenInterpreter {
  private cmdfns = new Map<string, (stack: string[]) => string[]>();
  private userCmdOps = new Map<string, string[]>();
  private loadingUserFunction = false;
  private setOutput: OutputFn = () => {};
  private lambdaOp = "_";
  private userfnStart = "(";
  private userfnEnd = ")";

  // Closure state for loadUserFunction
  private loadState: {
    started: boolean;
    name: string;
    depth: number;
  } = { started: false, name: "", depth: 0 };

  private magic8 = new Map([
    [0, "it is certain"],
    [1, "it is decidedly so"],
    [2, "without a doubt"],
    [3, "yes, definitely"],
    [4, "you may rely on it"],
    [5, "as I see it, yes"],
    [6, "most likely"],
    [7, "outlook good"],
    [8, "yes"],
    [9, "signs point to yes"],
    [10, "reply hazy try again"],
    [11, "ask again later"],
    [12, "better not tell you now"],
    [13, "cannot predict now"],
    [14, "concentrate and ask again"],
    [15, "don't count on it"],
    [16, "my reply is no"],
    [17, "my sources say no"],
    [18, "outlook not so good"],
    [19, "very doubtful"],
  ]);

  constructor() {
    this.registerCommands();
  }

  setOutputFn(fn: OutputFn) {
    this.setOutput = fn;
  }

  getUserCmdNames(): string[] {
    return [...this.userCmdOps.keys()].filter((n) => n !== this.lambdaOp);
  }

  exprToOps(expr: string): string[] {
    return expr.trim().split(/\s+/).filter((s) => s.length > 0);
  }

  evaluateOps(ops: string[]) {
    return (stack: string[]): string[] => {
      return ops.reduce((s, op) => this.handleOperation(s, op), stack);
    };
  }

  private handleOperation(stack: string[], op: string): string[] {
    if (this.loadingUserFunction) {
      this.loadingUserFunction = this.loadUserFunction(op);
      return stack;
    }
    if (this.cmdfns.has(op)) {
      return this.cmdfns.get(op)!(stack);
    }
    if (this.userCmdOps.has(op)) {
      const ops = this.userCmdOps.get(op)!;
      return this.evaluateOps(ops)(stack);
    }
    return [...stack, op];
  }

  private loadUserFunction(op: string): boolean {
    if (this.loadState.started) {
      if (op === this.userfnEnd) {
        if (this.loadState.depth === 0) {
          this.loadState.started = false;
          return false;
        }
        this.loadState.depth -= 1;
        this.userCmdOps.get(this.loadState.name)!.push(op);
        return true;
      }
      if (op === this.userfnStart) {
        this.loadState.depth += 1;
        this.userCmdOps.get(this.loadState.name)!.push(op);
        return true;
      }
      this.userCmdOps.get(this.loadState.name)!.push(op);
      return true;
    }
    // First token after ( is the command name
    this.loadState.name = op;
    this.userCmdOps.set(op, []);
    this.loadState.depth = 0;
    this.loadState.started = true;
    return true;
  }

  // ─── Unary op factory ───
  private unary(fn: (a: number) => number) {
    return (stack: string[]) => {
      const [rest, a] = popParse(stack);
      return [...rest, fn(a).toString()];
    };
  }

  // ─── Binary op factory ───
  private binary(fn: (a: number, b: number) => number) {
    return (stack: string[]) => {
      const [rest, a, b] = popParse2(stack);
      return [...rest, fn(a, b).toString()];
    };
  }

  private registerCommands() {
    // Constants & meta
    this.cmdfns.set("pi", (s) => [...s, Math.PI.toString()]);
    this.cmdfns.set("e", (s) => [...s, Math.E.toString()]);
    this.cmdfns.set("magic8", (s) => {
      const f = Math.floor(Math.random() * this.magic8.size);
      this.setOutput(this.magic8.get(f) ?? "error");
      return s;
    });

    const excluded = new Set([this.userfnStart, "magic8"]);
    this.cmdfns.set("cmds", (s) => {
      const all = [...this.cmdfns.keys()];
      const cmds = all.filter((c) => !excluded.has(c)).sort();
      this.setOutput(cmds.join(" "));
      return s;
    });
    this.cmdfns.set("help", (s) => {
      this.setOutput(HELP_TEXT);
      return s;
    });

    // Unary math
    this.cmdfns.set("abs", this.unary(Math.abs));
    this.cmdfns.set("chs", this.unary((a) => -a));
    this.cmdfns.set("floor", this.unary(Math.floor));
    this.cmdfns.set("ceil", this.unary(Math.ceil));
    this.cmdfns.set("inv", this.unary((a) => 1 / a));
    this.cmdfns.set("ln", this.unary(Math.log));
    this.cmdfns.set("log", this.unary(Math.log10));
    this.cmdfns.set("log2", this.unary(Math.log2));
    this.cmdfns.set("log10", this.unary(Math.log10));
    this.cmdfns.set("rand", this.unary((a) => Math.floor(a * Math.random())));
    this.cmdfns.set("round", this.unary(Math.round));
    this.cmdfns.set("sgn", this.unary(Math.sign));
    this.cmdfns.set("sqrt", this.unary(Math.sqrt));
    this.cmdfns.set("tng", this.unary((a) => (a * (a + 1)) / 2));
    this.cmdfns.set("!", this.unary((a) => {
      let res = 1;
      for (let i = 2; i <= a; i++) res *= i;
      return res;
    }));

    // Trig & conversion
    const r2d = 180 / Math.PI;
    this.cmdfns.set("deg_rad", this.unary((a) => a / r2d));
    this.cmdfns.set("rad_deg", this.unary((a) => a * r2d));
    this.cmdfns.set("sin", this.unary(Math.sin));
    this.cmdfns.set("cos", this.unary(Math.cos));
    this.cmdfns.set("tan", this.unary(Math.tan));
    this.cmdfns.set("asin", this.unary(Math.asin));
    this.cmdfns.set("acos", this.unary(Math.acos));
    this.cmdfns.set("atan", this.unary(Math.atan));
    this.cmdfns.set("c_f", this.unary((a) => (a * 9) / 5 + 32));
    this.cmdfns.set("f_c", this.unary((a) => ((a - 32) * 5) / 9));
    const miKm = 1.60934;
    this.cmdfns.set("mi_km", this.unary((a) => a * miKm));
    this.cmdfns.set("km_mi", this.unary((a) => a / miKm));
    const mFt = 3.28084;
    this.cmdfns.set("m_ft", this.unary((a) => a * mFt));
    this.cmdfns.set("ft_m", this.unary((a) => a / mFt));

    // Binary math & logic
    this.cmdfns.set("+", this.binary((a, b) => a + b));
    this.cmdfns.set("-", this.binary((a, b) => a - b));
    this.cmdfns.set("x", this.binary((a, b) => a * b));
    this.cmdfns.set("*", this.binary((a, b) => a * b));
    this.cmdfns.set("/", this.binary((a, b) => a / b));
    this.cmdfns.set("%", this.binary((a, b) => a % b));
    this.cmdfns.set("^", this.binary((a, b) => Math.pow(a, b)));
    this.cmdfns.set("min", this.binary(Math.min));
    this.cmdfns.set("max", this.binary(Math.max));
    this.cmdfns.set("nroot", this.binary((a, b) => Math.pow(a, 1 / b)));
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    this.cmdfns.set("gcd", this.binary(gcd));
    this.cmdfns.set("logn", this.binary((a, b) => Math.log(a) / Math.log(b)));
    this.cmdfns.set("and", this.binary((a, b) => a & b));
    this.cmdfns.set("nand", this.binary((a, b) => ~(a & b)));
    this.cmdfns.set("nor", this.binary((a, b) => ~(a | b)));
    this.cmdfns.set("not", this.unary((a) => ~a));
    const popCount = (u: number) => {
      let f = 0;
      let v = u;
      while (v) {
        f += v & 1;
        v >>= 1;
      }
      return f;
    };
    this.cmdfns.set("ones", this.unary(popCount));
    this.cmdfns.set("or", this.binary((a, b) => a | b));
    this.cmdfns.set("xor", this.binary((a, b) => a ^ b));
    this.cmdfns.set("xnor", this.binary((a, b) => ~(a ^ b)));
    this.cmdfns.set(">>", this.binary((a, b) => a >> b));
    this.cmdfns.set("<<", this.binary((a, b) => a << b));

    // Polynomial roots
    this.cmdfns.set("proot", (s) => {
      const [rest, a, b, c] = popParse3(s); // c is top = constant term
      const P = b * b - 4 * a * c;
      let $, R, M, D;
      if (P < 0) {
        $ = -b / (2 * a);
        R = Math.sqrt(-P) / (2 * a);
        M = (-b / (2 * a)).toString();
        D = (-1 * Math.sqrt(-P)) / (2 * a);
      } else {
        $ = (-b + Math.sqrt(P)) / (2 * a);
        R = 0;
        M = (-b - Math.sqrt(P)) / (2 * a);
        D = 0;
      }
      return [...rest, $.toString(), R.toString(), M.toString(), D.toString()];
    });

    // Base / ASCII conversions
    this.cmdfns.set("dec_hex", (s) => {
      const [rest, a] = popParse(s);
      return [...rest, a.toString(16)];
    });
    this.cmdfns.set("hex_dec", (s) => {
      const val = parseInt(last(s) ?? "0", 16);
      return [...init(s), val.toString()];
    });
    this.cmdfns.set("dec_bin", (s) => {
      const [rest, a] = popParse(s);
      return [...rest, a.toString(2)];
    });
    this.cmdfns.set("bin_dec", (s) => {
      const val = parseInt(last(s) ?? "0", 2);
      return [...init(s), val.toString()];
    });
    this.cmdfns.set("dec_oct", (s) => {
      const [rest, a] = popParse(s);
      return [...rest, a.toString(8)];
    });
    this.cmdfns.set("oct_dec", (s) => {
      const val = parseInt(last(s) ?? "0", 8);
      return [...init(s), val.toString()];
    });
    this.cmdfns.set("hex_bin", (s) => {
      const val = parseInt(last(s) ?? "0", 16);
      return [...init(s), val.toString(2)];
    });
    this.cmdfns.set("bin_hex", (s) => {
      const val = parseInt(last(s) ?? "0", 2);
      return [...init(s), val.toString(16)];
    });
    this.cmdfns.set("dec_ascii", (s) => {
      const [rest, a] = popParse(s);
      return [...rest, String.fromCharCode(a)];
    });
    this.cmdfns.set("ascii_dec", (s) => {
      const val = (last(s) ?? "").charCodeAt(0);
      return [...init(s), val.toString()];
    });

    // User functions
    this.cmdfns.set("store", (s) => {
      const name = last(s) ?? "";
      const body = s[s.length - 2] ?? "";
      const rest = s.slice(0, -2);
      this.userCmdOps.set(name, [body]);
      return rest;
    });
    this.cmdfns.set(this.userfnStart, (s) => {
      this.loadingUserFunction = true;
      return s;
    });
    this.cmdfns.set("map", (s) => {
      const lambda = this.userCmdOps.get(this.lambdaOp);
      if (!lambda) return s;
      return s.flatMap((item) => this.evaluateOps(lambda)([item]));
    });
    this.cmdfns.set("fold", (s) => {
      const lambda = this.userCmdOps.get(this.lambdaOp);
      if (!lambda) return s;
      let k = s;
      while (k.length > 1) {
        k = this.evaluateOps(lambda)(k);
      }
      return k;
    });
    this.cmdfns.set("reduce", (s) => {
      const lambda = this.userCmdOps.get(this.lambdaOp);
      if (!lambda) return s;
      let k = s;
      while (k.length > 1) {
        k = this.evaluateOps(lambda)(k);
      }
      return k;
    });

    // RGB
    const scaleHex = (factor: number) => (rgb: number[]) =>
      rgbToHex(
        clamp255(rgb[0] * factor),
        clamp255(rgb[1] * factor),
        clamp255(rgb[2] * factor),
      );
    const fullScale = scaleHex(1);

    this.cmdfns.set("rgb_code", (s) => {
      const [rest, r, g, b] = popParse3(s);
      return [...rest, fullScale([r, g, b])];
    });
    this.cmdfns.set("code_rgb", (s) => {
      const hex = last(s) ?? "";
      const rest = init(s);
      const rgb = parseHex(hex);
      return [...rest, ...rgb.map((n) => n.toString())];
    });
    this.cmdfns.set("rgb_x", (s) => {
      const [rest, r, g, b, factor] = popParse4(s);
      return [...rest, scaleHex(factor)([r, g, b])];
    });
    this.cmdfns.set("code_x", (s) => {
      const factor = parseFloat(last(s) ?? "1");
      const rest1 = init(s);
      const hex = last(rest1) ?? "";
      const rest = init(rest1);
      const rgb = parseHex(hex);
      return [...rest, scaleHex(factor)(rgb)];
    });
    this.cmdfns.set("code_avg", (s) => {
      const hex2 = last(s) ?? "";
      const rest1 = init(s);
      const hex1 = last(rest1) ?? "";
      const rest = init(rest1);
      const rgb1 = parseHex(hex1);
      const rgb2 = parseHex(hex2);
      const avg = rgb1.map((v, i) => (v + (rgb2[i] ?? 0)) / 2);
      return [...rest, fullScale(avg)];
    });

    // Stack manipulation
    this.cmdfns.set("cls", () => []);
    this.cmdfns.set("drop", (s) => init(s));
    this.cmdfns.set("dropn", (s) => {
      const [rest, n] = popParse(s);
      return drop(n)(rest);
    });
    this.cmdfns.set("dup", (s) => [...s, last(s) ?? ""]);
    this.cmdfns.set("rev", (s) => reverse(s));
    this.cmdfns.set("reverse", (s) => reverse(s));
    this.cmdfns.set("roll", (s) => {
      const top = last(s) ?? "";
      return [top, ...init(s)];
    });
    this.cmdfns.set("rolln", (s) => {
      const [rest, n] = popParse(s);
      const moved = take(n)(rest);
      const kept = drop(n)(rest);
      return [...moved, ...kept];
    });
    this.cmdfns.set("rot", (s) => {
      const first = head(s) ?? "";
      return [...tail(s), first];
    });
    this.cmdfns.set("rotn", (s) => {
      const [rest, n] = popParse(s);
      const moved = takeLast(n)(rest);
      const kept = dropLast(n)(rest);
      return [...moved, ...kept];
    });
    this.cmdfns.set("swap", (s) => {
      const [rest, a, b] = popParse2(s);
      return [...rest, b.toString(), a.toString()];
    });
    this.cmdfns.set("head", (s) => [head(s) ?? ""]);
    this.cmdfns.set("tail", (s) => tail(s));
    this.cmdfns.set("init", (s) => init(s));
    this.cmdfns.set("last", (s) => [last(s) ?? ""]);
    this.cmdfns.set("taken", (s) => {
      const [rest, n] = popParse(s);
      return take(n)(rest);
    });

    // Aggregates / list
    this.cmdfns.set("sum", (s) => {
      const total = s.reduce((acc, v) => acc + parseFloat(v), 0);
      return [total.toString()];
    });
    this.cmdfns.set("prod", (s) => {
      const total = s.reduce((acc, v) => acc * parseFloat(v), 1);
      return [total.toString()];
    });
    this.cmdfns.set("mean", (s) => {
      const total = s.reduce((acc, v) => acc + parseFloat(v), 0);
      return [(total / s.length).toString()];
    });
    this.cmdfns.set("io", (s) => {
      const [rest, w] = popParse(s);
      return [...rest, ...iota(w).map((n) => n.toString())];
    });
    this.cmdfns.set("to", (s) => {
      const [rest, start, end, step] = popParse3(s);
      const range = unfoldRange(start, end, step);
      return [...rest, ...range.map((n) => n.toString())];
    });
  }
}

export const HELP_TEXT = `Coren is a command interpreter that takes a list of postfix operations and
executes them to return the result (for example, '3 2 x' multiplies 3 and 2).
The available commands can be displayed by entering "cmds".
`;

export const interpreter = new CorenInterpreter();
