// Original descriptions and snippets; API names/signatures follow the upstream references in docs/SOURCES.md.
const reference = "https://docs.arduino.cc/language-reference/";
const argumentHelp = {
  pin: "Arduino pin number or a named pin constant.",
  mode: "The operating mode required by this function.",
  value: "Value to write, print, or transform.",
  ms: "Duration in milliseconds.",
  us: "Duration in microseconds.",
  baud: "Serial speed in bits per second; match the receiving device.",
  angle: "Servo position in degrees (usually 0–180).",
  address: "Device or storage address.",
  index: "Zero-based element or pixel index.",
  col: "Zero-based display column.",
  row: "Zero-based display row.",
  text: "Text or a value to print.",
  count: "Number of items.",
  frequency: "Frequency in hertz.",
  duration: "Duration in milliseconds.",
  dataPin: "Pin carrying the data.",
  clockPin: "Pin carrying the clock signal.",
  bitOrder: "MSBFIRST or LSBFIRST.",
  bit: "Zero-based bit position.",
  timeout: "Maximum wait in microseconds.",
  state: "HIGH or LOW.",
  interrupt: "Use digitalPinToInterrupt(pin).",
  handler: "Name of your interrupt callback function.",
  low: "Lower bound.",
  high: "Upper bound.",
  x: "Input value.",
  y: "Second value.",
  fromLow: "Lower bound of the input range.",
  fromHigh: "Upper bound of the input range.",
  toLow: "Lower bound of the output range.",
  toHigh: "Upper bound of the output range.",
  red: "Red channel, 0–255.",
  green: "Green channel, 0–255.",
  blue: "Blue channel, 0–255.",
};
export function splitArguments(value) {
  if (!value) return [];
  let depth = 0,
    quote = "",
    start = 0;
  const result = [];
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = "";
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      continue;
    }
    if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    if (c === "," && depth === 0) {
      result.push(value.slice(start, i));
      start = i + 1;
    }
  }
  result.push(value.slice(start));
  return result;
}
export function fn(label, args, summary, options = {}) {
  const parameters = args.map((a) => {
    const [name, fallback] = a.split("=");
    return {
      name,
      fallback: fallback ?? name,
      description:
        argumentHelp[name] ??
        `The ${name} argument. See the reference for valid values and overloads.`,
    };
  });
  return {
    kind: "function",
    label,
    summary,
    parameters,
    signature: `${label}(${parameters.map((p) => p.name).join(", ")})`,
    template: `${label}(${parameters.map((p, i) => "${" + (i + 1) + ":" + p.fallback + "}").join(", ")})`,
    source: "Arduino",
    url: reference,
    ...options,
  };
}
const f = (name, args, summary, example, details = "") =>
  fn(name, args ? args.split(",") : [], summary, { example, details });
export const core = [
  f(
    "pinMode",
    "pin,mode=OUTPUT",
    "Configure a digital pin.",
    "pinMode(LED_BUILTIN, OUTPUT);",
    "Use INPUT, OUTPUT, or INPUT_PULLUP. Pull-up inputs read LOW when connected to ground.",
  ),
  f(
    "digitalWrite",
    "pin,value=HIGH",
    "Set a digital output HIGH or LOW.",
    "digitalWrite(LED_BUILTIN, HIGH);",
    "Configure the pin as OUTPUT first. On an input, this controls the pull-up resistor.",
  ),
  f(
    "digitalRead",
    "pin",
    "Read a digital input.",
    "int pressed = digitalRead(2);",
    "Returns HIGH or LOW. Use a pull-up or pull-down to avoid a floating input.",
  ),
  f(
    "analogRead",
    "pin=A0",
    "Read an analog input.",
    "int light = analogRead(A0);",
    "On Arduino Uno, the result is 0–1023 for the selected analog reference range.",
  ),
  f(
    "analogWrite",
    "pin,value=128",
    "Write a PWM duty cycle.",
    "analogWrite(9, 128);",
    "On Uno, use PWM pins 3, 5, 6, 9, 10, or 11. Duty cycle is 0–255; this is not a true analog voltage.",
  ),
  f(
    "analogReference",
    "mode=DEFAULT",
    "Select the analog input reference.",
    "analogReference(DEFAULT);",
  ),
  f(
    "delay",
    "ms=1000",
    "Pause the program in milliseconds.",
    "delay(1000);",
    "Blocking: other code in loop() does not run while waiting. Use millis() for nonblocking timing.",
  ),
  f(
    "delayMicroseconds",
    "us=10",
    "Pause in microseconds.",
    "delayMicroseconds(10);",
  ),
  f(
    "millis",
    "",
    "Milliseconds since the program started.",
    "unsigned long now = millis();",
    "Returns unsigned long and wraps after about 50 days. Compare elapsed time using unsigned subtraction.",
  ),
  f(
    "micros",
    "",
    "Microseconds since the program started.",
    "unsigned long started = micros();",
    "Returns unsigned long; wraparound and resolution depend on the board.",
  ),
  f(
    "tone",
    "pin,frequency=440",
    "Generate a square-wave tone.",
    "tone(8, 440);",
    "An optional third argument is duration in milliseconds. Stop with noTone(pin).",
  ),
  f("noTone", "pin", "Stop a tone on a pin.", "noTone(8);"),
  f(
    "pulseIn",
    "pin,state=HIGH,timeout=1000000",
    "Measure a pulse in microseconds.",
    "unsigned long duration = pulseIn(7, HIGH, 30000);",
    "Returns 0 if no complete pulse is measured before the timeout.",
  ),
  f(
    "pulseInLong",
    "pin,state=HIGH,timeout=1000000",
    "Measure a pulse with a long timeout.",
    "unsigned long duration = pulseInLong(7, HIGH, 1000000);",
  ),
  f(
    "shiftOut",
    "dataPin,clockPin,bitOrder=MSBFIRST,value",
    "Shift out one byte.",
    "shiftOut(2, 3, MSBFIRST, 128);",
  ),
  f(
    "shiftIn",
    "dataPin,clockPin,bitOrder=MSBFIRST",
    "Read one byte from a shift register.",
    "byte result = shiftIn(2, 3, MSBFIRST);",
  ),
  f(
    "attachInterrupt",
    "interrupt=digitalPinToInterrupt(2),handler,mode=RISING",
    "Register an interrupt callback.",
    "attachInterrupt(digitalPinToInterrupt(2), onPulse, RISING);",
    "Uno external interrupts use pins 2 and 3. Keep the handler short; shared variables usually need volatile.",
  ),
  f(
    "detachInterrupt",
    "interrupt=digitalPinToInterrupt(2)",
    "Remove an interrupt callback.",
    "detachInterrupt(digitalPinToInterrupt(2));",
  ),
  f(
    "digitalPinToInterrupt",
    "pin=2",
    "Convert a pin to an interrupt number.",
    "digitalPinToInterrupt(2)",
  ),
  f("interrupts", "", "Enable interrupts.", "interrupts();"),
  f(
    "noInterrupts",
    "",
    "Temporarily disable interrupts.",
    "noInterrupts();",
    "Re-enable interrupts promptly; timing and communication depend on them.",
  ),
  f(
    "map",
    "value,fromLow=0,fromHigh=1023,toLow=0,toHigh=255",
    "Scale an integer between ranges.",
    "int brightness = map(analogRead(A0), 0, 1023, 0, 255);",
    "Uses integer arithmetic and does not constrain the result.",
  ),
  f(
    "constrain",
    "value,low=0,high=255",
    "Clamp a value to an inclusive range.",
    "int limited = constrain(value, 0, 255);",
  ),
  f("min", "x,y", "Return the smaller value.", "int smallest = min(a, b);"),
  f("max", "x,y", "Return the larger value.", "int largest = max(a, b);"),
  f("abs", "x", "Return an absolute value.", "int distance = abs(a - b);"),
  f("sq", "x", "Square a value.", "int square = sq(5);"),
  f("sqrt", "x", "Return the square root.", "float root = sqrt(25);"),
  f("pow", "x,y", "Raise x to the power y.", "float result = pow(2, 3);"),
  f("sin", "x", "Sine of an angle in radians.", "float y = sin(PI / 2);"),
  f("cos", "x", "Cosine of an angle in radians.", "float y = cos(PI);"),
  f("tan", "x", "Tangent of an angle in radians.", "float y = tan(PI / 4);"),
  f(
    "random",
    "low=0,high=100",
    "Generate a pseudorandom integer.",
    "long roll = random(1, 7);",
    "The lower bound is inclusive; the upper bound is exclusive.",
  ),
  f(
    "randomSeed",
    "value",
    "Seed the pseudorandom generator.",
    "randomSeed(analogRead(A0));",
  ),
  ...["bitRead", "bitSet", "bitClear"].map((name) =>
    f(
      name,
      "value,bit",
      `${name === "bitRead" ? "Read" : name === "bitSet" ? "Set" : "Clear"} a single bit.`,
      `${name}(flags, 2);`,
    ),
  ),
  f(
    "bitWrite",
    "value,bit,state=HIGH",
    "Set a bit to 0 or 1.",
    "bitWrite(flags, 2, HIGH);",
  ),
  f("bit", "bit", "Return a mask with one bit set.", "byte mask = bit(3);"),
  f("lowByte", "value", "Extract the low byte.", "byte low = lowByte(512);"),
  f(
    "highByte",
    "value",
    "Extract the high byte.",
    "byte high = highByte(512);",
  ),
  ...[
    "isAlpha",
    "isAlphaNumeric",
    "isAscii",
    "isControl",
    "isDigit",
    "isGraph",
    "isHexadecimalDigit",
    "isLowerCase",
    "isPrintable",
    "isPunct",
    "isSpace",
    "isUpperCase",
    "isWhitespace",
  ].map((name) =>
    f(
      name,
      "value",
      `Test a character: ${name
        .slice(2)
        .replace(/[A-Z]/g, (s) => " " + s.toLowerCase())
        .trim()}.`,
      `${name}('A')`,
    ),
  ),
  f(
    "sizeof",
    "value",
    "Size of a value or type in bytes.",
    "int count = sizeof(pins) / sizeof(pins[0]);",
  ),
  f(
    "F",
    'text="text"',
    "Keep a string literal in flash memory.",
    'Serial.println(F("Hello"));',
  ),
];
const constantHelp = {
  HIGH: "Digital logic high.",
  LOW: "Digital logic low.",
  INPUT: "Configure as an input.",
  OUTPUT: "Configure as an output.",
  INPUT_PULLUP: "Input with an internal pull-up.",
  LED_BUILTIN: "The built-in LED pin (13 on Uno).",
  true: "Boolean true.",
  false: "Boolean false.",
  NULL: "Null pointer constant.",
  PI: "The circle constant pi.",
  DEFAULT: "Default analog reference.",
  INTERNAL: "Internal analog reference.",
  EXTERNAL: "External analog reference.",
  CHANGE: "Interrupt on either edge.",
  RISING: "Interrupt on a rising edge.",
  FALLING: "Interrupt on a falling edge.",
  LSBFIRST: "Least significant bit first.",
  MSBFIRST: "Most significant bit first.",
  DEC: "Decimal number formatting.",
  HEX: "Hexadecimal number formatting.",
  OCT: "Octal number formatting.",
  BIN: "Binary number formatting.",
};
export const constants = Object.entries({
  ...constantHelp,
  ...Object.fromEntries(
    Array.from({ length: 6 }, (_, i) => ["A" + i, `Analog input ${i} on Uno.`]),
  ),
}).map(([label, summary]) => ({
  label,
  summary,
  kind: "constant",
  template: label,
  source: "Arduino",
  url: reference,
}));
export const types = [
  "int",
  "unsigned int",
  "long",
  "unsigned long",
  "float",
  "double",
  "bool",
  "boolean",
  "char",
  "byte",
  "word",
  "void",
  "String",
  "size_t",
  "uint8_t",
  "uint16_t",
  "uint32_t",
  "int8_t",
  "int16_t",
  "int32_t",
  "const",
  "static",
  "volatile",
  "struct",
  "enum",
  "class",
  "typedef",
].map((label) => ({
  label,
  summary: `C++ / Arduino ${label} keyword or type.`,
  kind: "type",
  template: label,
  source: "C++",
  url: reference,
}));
const snippet = (label, template, summary) => ({
  label,
  template,
  summary,
  kind: "snippet",
  source: "C++",
  details:
    "TAB moves between highlighted fields. Repeated fields stay in sync. Escape exits the template.",
  url: reference,
});
export const snippets = [
  snippet(
    "if",
    "if (${1:condition}) {\n\t${0}\n}",
    "Run a block when a condition is true.",
  ),
  snippet(
    "ifelse",
    "if (${1:condition}) {\n\t${2}\n} else {\n\t${0}\n}",
    "Choose between two blocks.",
  ),
  snippet("else", "else {\n\t${0}\n}", "Fallback branch of an if statement."),
  snippet(
    "for",
    "for (int ${1:i} = ${2:0}; ${1} < ${3:10}; ${1}++) {\n\t${0}\n}",
    "Repeat with an index and an upper bound.",
  ),
  snippet(
    "while",
    "while (${1:condition}) {\n\t${0}\n}",
    "Repeat while a condition remains true.",
  ),
  snippet(
    "dowhile",
    "do {\n\t${1}\n} while (${2:condition});${0}",
    "Run at least once, then check a condition.",
  ),
  snippet(
    "switch",
    "switch (${1:value}) {\n\tcase ${2:1}:\n\t\t${3}\n\t\tbreak;\n\tdefault:\n\t\t${0}\n\t\tbreak;\n}",
    "Select a branch by value.",
  ),
  snippet(
    "case",
    "case ${1:value}:\n\t${0}\n\tbreak;",
    "Add a case to a switch.",
  ),
  snippet(
    "setup",
    "void setup() {\n\t${0}\n}",
    "Run initialization once at startup.",
  ),
  snippet("loop", "void loop() {\n\t${0}\n}", "Run this block repeatedly."),
  snippet(
    "function",
    "${1:void} ${2:functionName}(${3}) {\n\t${0}\n}",
    "Define a function with editable name and parameters.",
  ),
  snippet(
    "array",
    "${1:int} ${2:values}[] = {${3:1, 2, 3}};${0}",
    "Declare and initialize an array.",
  ),
  snippet(
    "const",
    "const ${1:int} ${2:LED_PIN} = ${3:13};${0}",
    "Declare a named constant.",
  ),
  snippet(
    "struct",
    "struct ${1:Reading} {\n\t${2:int value;}\n};${0}",
    "Define a structure.",
  ),
  snippet(
    "enum",
    "enum ${1:State} { ${2:OFF, ON} };${0}",
    "Define named states.",
  ),
  snippet(
    "class",
    "class ${1:Device} {\npublic:\n\t${2:void begin();}\nprivate:\n\t${0}\n};",
    "Define a class.",
  ),
  snippet(
    "return",
    "return ${1:value};${0}",
    "Return a value from a function.",
  ),
  snippet("break", "break;${0}", "Exit a loop or switch."),
  snippet(
    "continue",
    "continue;${0}",
    "Continue with the next loop iteration.",
  ),
];
const method = (name, args, summary, details = "") =>
  fn(name, args ? args.split(",") : [], summary, { details });
export const printMethods = [
  method("print", "value", "Print without a line break."),
  method("println", "value", "Print followed by a line break."),
  method("write", "value", "Write raw byte data."),
];
export const serialMethods = [
  method("begin", "baud=9600", "Start serial communication."),
  method("end", "", "Stop serial communication."),
  method("available", "", "Return the number of unread bytes."),
  method("availableForWrite", "", "Return free transmit buffer space."),
  method("read", "", "Read the next byte; -1 if none is available."),
  method("peek", "", "Inspect the next byte without removing it."),
  method("flush", "", "Wait for outgoing bytes to finish transmitting."),
  ...printMethods,
  method("parseInt", "", "Read the next integer from the stream."),
  method("parseFloat", "", "Read the next floating-point number."),
  method("readString", "", "Read text until the timeout."),
  method("readStringUntil", "terminator='\\n'", "Read text up to a delimiter."),
  method("readBytes", "buffer,length", "Read bytes into a buffer."),
  method("setTimeout", "ms=1000", "Set the stream timeout in milliseconds."),
];
export const stringMethods = [
  method("length", "", "Return the number of characters."),
  method("charAt", "index", "Read a character."),
  method("indexOf", "text", "Find text; -1 if not present."),
  method("substring", "from,to", "Extract a substring."),
  method("toInt", "", "Convert text to an integer."),
  method("toFloat", "", "Convert text to a floating-point value."),
  method("trim", "", "Remove leading and trailing whitespace."),
  method("toUpperCase", "", "Convert letters to uppercase."),
  method("toLowerCase", "", "Convert letters to lowercase."),
  method("replace", "find,replacement", "Replace matching text."),
  method("startsWith", "text", "Test a prefix."),
  method("endsWith", "text", "Test a suffix."),
  method("equals", "text", "Compare text."),
  method("concat", "value", "Append a value."),
  method("reserve", "size", "Reserve space for characters."),
];
