(() => {
  const cm = CodeMirror.fromTextArea(document.getElementById("code"), {
    mode: "text/x-c++src",
    lineNumbers: true,
    indentUnit: 2,
    extraKeys: { Tab: "indentMore", "Shift-Tab": "indentLess" },
  });
  const examples = {
    pin: "// Configure the built-in LED.\n// Type pin, then press TAB.\n\nvoid setup() {\n  \n}\n\nvoid loop() {\n  digitalWrite(LED_BUILTIN, HIGH);\n  delay(1000);\n}",
    serial:
      "// Type Serial. to explore the serial port.\n\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  \n}",
    loop: "// Type for and press TAB.\n// Rename i: all three occurrences stay in sync.\n\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  \n}",
    servo:
      "#include <Servo.h>\n\nServo arm;\n\nvoid setup() {\n  arm.attach(9);\n}\n\nvoid loop() {\n  \n}",
  };
  function show(name) {
    cm.setValue(examples[name]);
    cm.clearHistory();
    const line =
      name === "pin" ? 4 : name === "serial" ? 7 : name === "loop" ? 8 : 9;
    cm.setCursor(line, 2);
    cm.focus();
  }
  for (const button of document.querySelectorAll("[data-example]"))
    button.addEventListener("click", () => show(button.dataset.example));
  document.getElementById("mode").addEventListener("change", (e) => {
    cm.setOption("readOnly", e.target.value === "blocks");
    cm.setOption(
      "mode",
      e.target.value === "python" ? "text/x-python" : "text/x-c++src",
    );
  });
  show("pin");
})();
