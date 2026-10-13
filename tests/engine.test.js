import { test } from "node:test";
import assert from "node:assert/strict";
import { complete, insertionTemplate, MAX_CODE_SIZE } from "../src/engine.js";
import { analyze, lexical, visibleSymbols } from "../src/syntax.js";
import { expandSnippet } from "../src/snippets.js";
import { core, snippets } from "../src/catalog.js";
import { libraries } from "../src/libraries.js";
import { normalizeSettings } from "../src/settings.js";
const at = (source, options = {}) => {
  const offset = source.indexOf("|");
  assert(offset >= 0);
  return complete(source.replace("|", ""), offset, options);
};
const labels = (r) => r?.entries.map((e) => e.label) ?? [];

test("Arduino functions: threshold, case, middle-of-word replacement, camel initials", () => {
  assert.equal(at("p|"), null);
  assert(labels(at("pi|")).includes("pinMode"));
  assert.equal(labels(at("DIG|"))[0], "digitalWrite");
  assert(labels(at("dW|")).includes("digitalWrite"));
  assert.deepEqual([at("pinM|ode").from, at("pinM|ode").to], [0, 7]);
  assert(labels(at("|", { explicit: true })).includes("pinMode"));
});
test("comments and strings are not code, including raw and unfinished strings", () => {
  for (const s of ["// pin|", "/* pin|", '"pin|', "'p|", 'R"x(pin|)x"'])
    assert.equal(at(s, { explicit: true }), null, s);
  assert(labels(at("/* comment */ pin|")).includes("pinMode"));
  assert.equal(
    lexical('"https://example.com" // hi\npin').clean.endsWith("\npin"),
    true,
  );
});
test("includes complete bundled headers only and activate their catalogs", () => {
  assert.deepEqual(labels(at("#include <Ser|")), ["Servo.h"]);
  const include = at("#include <Ser|vo.h>");
  assert.equal(include.entries[0].template, "Servo.h");
  assert.equal(include.to, 17);
  assert(
    labels(at("#include <Servo.h>\nServo arm;\nvoid loop(){arm.|}")).includes(
      "attach",
    ),
  );
  assert(!labels(at("Servo arm;\nvoid loop(){arm.|}")).includes("attach"));
  assert(
    !labels(at("// #include <Servo.h>\nServo arm; arm.|")).includes("attach"),
  );
  assert(
    !labels(at("/*\n#include <Servo.h>\n*/\nServo arm;arm.|")).includes(
      "attach",
    ),
  );
  assert(labels(at('#include "Wire.h"\nWire.|')).includes("beginTransmission"));
});
test("Serial methods and String methods are contextual", () => {
  assert(labels(at("Serial.|")).includes("println"));
  assert.equal(labels(at("Serial.pr|"))[0], "print");
  assert(labels(at("String greeting;\ngreeting.|")).includes("substring"));
  assert.deepEqual(labels(at("unknown.|")), []);
  assert.deepEqual(labels(at("int Serial;\nSerial.|")), []);
});
test("variables, function arguments, definitions, macros and scopes", () => {
  const source =
    "#define LED_PIN 13\nint globalCount;\nvoid blink(int pin, unsigned long waitMs) { int localCount;\n lo|\n}\nvoid other(){int otherLocal;}";
  assert(labels(at(source)).includes("localCount"));
  assert(!labels(at(source)).includes("otherLocal"));
  assert(labels(at(source.replace("lo|", "pi|"))).includes("pin"));
  assert(labels(at(source.replace("lo|", "bl|"))).includes("blink"));
  const source2 = "int globalCount; void loop(){ if(true){int hidden;} hi| }";
  assert(!labels(at(source2)).includes("hidden"));
  const funcs = at("void blink(int pin, int count){}\nvoid loop(){bl|}");
  const entry = funcs.entries.find((e) => e.label === "blink");
  assert.equal(entry.template, "blink(${1:pin}, ${2:count})");
});
test("unfinished function bodies retain variables and typed instances", () => {
  const source =
    "#include <Servo.h>\nServo arm;\nvoid loop(){ int sensor;\n se|";
  assert(labels(at(source)).includes("sensor"));
  assert(labels(at(source.replace("se|", "arm.|"))).includes("write"));
});
test("inner declarations shadow outer instance types", () => {
  const result = at(
    "#include <Servo.h>\nServo thing; void loop(){String thing; thing.|}",
  );
  assert(labels(result).includes("length"));
  assert(!labels(result).includes("attach"));
});
test("statements get semicolons, nested calls do not, existing arguments are preserved", () => {
  for (const [source, label, expected] of [
    ["  pin|", "pinMode", "pinMode(pin, OUTPUT);"],
    ["int x = ana|", "analogRead", "analogRead(A0)"],
    ["if (dig|)", "digitalRead", "digitalRead(pin)"],
    ["Serial.pr|", "print", "print(value);"],
    ["pin|(2, OUTPUT);", "pinMode", "pinMode"],
    ["pin|;", "pinMode", "pinMode(pin, OUTPUT)"],
  ]) {
    const r = at(source),
      e = r.entries.find((e) => e.label === label);
    assert(e, source);
    assert.equal(
      expandSnippet(insertionTemplate(e, r, source.replace("|", ""))).text,
      expected,
      source,
    );
  }
});
test("snippets expand linked stops, indentation and final cursor", () => {
  const expanded = expandSnippet(
    snippets.find((s) => s.label === "for").template,
    { indent: "  ", unit: "  " },
  );
  assert.equal(expanded.text, "for (int i = 0; i < 10; i++) {\n    \n  }");
  assert.equal(expanded.stops.filter((s) => s.number === 1).length, 3);
  assert(expanded.stops.some((s) => s.number === 0));
});
test("all catalog snippets are resolved and every function exposes parameter documentation", () => {
  for (const e of [
    ...core,
    ...snippets,
    ...libraries.flatMap((l) => l.methods),
  ]) {
    assert(!expandSnippet(e.template).text.includes("${"), e.label);
    if (e.kind === "function")
      assert(e.parameters.every((p) => p.description.length > 5));
  }
  assert(libraries.length >= 10);
});
test("large input is bounded and settings messages are validated", () => {
  assert.equal(
    complete("x".repeat(MAX_CODE_SIZE + 1), 5, { explicit: true }),
    null,
  );
  assert.deepEqual(
    normalizeSettings({
      enabled: "no",
      auto: false,
      threshold: 999,
      delay: -1,
    }),
    { enabled: true, auto: false, threshold: 4, delay: 0 },
  );
});

test("prototype argument names do not leak into the calling scope", () => {
  assert(
    !labels(at("void blink(int secretPin);\nvoid loop(){se|}")).includes(
      "secretPin",
    ),
  );
  assert(
    !labels(at("void loop(){void blink(int secretPin);se|}")).includes(
      "secretPin",
    ),
  );
});
test("nested constructor defaults remain a single SPI parameter", () => {
  const entry = libraries
    .find((l) => l.global === "SPI")
    .methods.find((e) => e.label === "beginTransaction");
  assert.equal(entry.parameters.length, 1);
  assert.equal(
    expandSnippet(entry.template).text,
    "beginTransaction(SPISettings(1000000, MSBFIRST, SPI_MODE0))",
  );
});
