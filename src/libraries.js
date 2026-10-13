import { fn, printMethods, serialMethods, splitArguments } from "./catalog.js";
const m = (name, args, summary) => fn(name, splitArguments(args), summary);
const library = (header, type, methods, options = {}) => ({
  header,
  type,
  methods,
  ...options,
});
export const libraries = [
  library(
    "Servo.h",
    "Servo",
    [
      m("attach", "pin=9", "Attach the servo to a pin."),
      m("detach", "", "Release the servo pin."),
      m("write", "angle=90", "Set the target angle in degrees."),
      m("writeMicroseconds", "us=1500", "Set the pulse width in microseconds."),
      m("read", "", "Read the last commanded angle."),
      m("attached", "", "Check whether the servo is attached."),
    ],
    {
      declaration: "Servo ${1:servo};${0}",
      url: "https://docs.arduino.cc/libraries/servo/",
    },
  ),
  library(
    "LiquidCrystal.h",
    "LiquidCrystal",
    [
      m("begin", "cols=16,rows=2", "Initialize the display dimensions."),
      m("clear", "", "Clear the display."),
      m("home", "", "Move to the first display position."),
      m("setCursor", "col=0,row=0", "Position the cursor."),
      ...printMethods,
      ...[
        "display",
        "noDisplay",
        "cursor",
        "noCursor",
        "blink",
        "noBlink",
        "scrollDisplayLeft",
        "scrollDisplayRight",
        "autoscroll",
        "noAutoscroll",
      ].map((n) =>
        m(
          n,
          "",
          {
            display: "Turn on the display.",
            noDisplay: "Hide the display.",
            cursor: "Show the cursor.",
            noCursor: "Hide the cursor.",
            blink: "Blink the cursor.",
            noBlink: "Stop cursor blinking.",
            scrollDisplayLeft: "Scroll the display one place left.",
            scrollDisplayRight: "Scroll the display one place right.",
            autoscroll: "Enable automatic scrolling.",
            noAutoscroll: "Disable automatic scrolling.",
          }[n],
        ),
      ),
      m("createChar", "index=0,bitmap", "Define a custom 5×8 character."),
    ],
    {
      declaration:
        "LiquidCrystal ${1:lcd}(${2:12}, ${3:11}, ${4:5}, ${5:4}, ${6:3}, ${7:2});${0}",
      url: "https://docs.arduino.cc/libraries/liquidcrystal/",
    },
  ),
  library(
    "Wire.h",
    "TwoWire",
    [
      m("begin", "", "Join the I2C bus as controller."),
      m("beginTransmission", "address", "Begin writing to an I2C device."),
      m(
        "endTransmission",
        "",
        "Send the buffered message; return an error code.",
      ),
      m("requestFrom", "address,count", "Request bytes from an I2C device."),
      m("write", "value", "Queue bytes for transmission."),
      m("available", "", "Count received bytes."),
      m("read", "", "Read a received byte."),
      m("setClock", "frequency=100000", "Set the I2C clock in hertz."),
      m("onReceive", "handler", "Register a peripheral receive handler."),
      m("onRequest", "handler", "Register a peripheral request handler."),
    ],
    {
      global: "Wire",
      url: "https://docs.arduino.cc/language-reference/en/functions/communication/wire/",
    },
  ),
  library(
    "EEPROM.h",
    "EEPROMClass",
    [
      m("read", "address=0", "Read a byte from persistent memory."),
      m("write", "address=0,value", "Write a byte to persistent memory."),
      m("update", "address=0,value", "Write only if the byte has changed."),
      m("get", "address=0,value", "Read a typed value into a variable."),
      m("put", "address=0,value", "Store a typed value."),
      m("length", "", "Return the storage size in bytes."),
    ],
    {
      global: "EEPROM",
      url: "https://docs.arduino.cc/learn/built-in-libraries/eeprom/",
    },
  ),
  library(
    "SPI.h",
    "SPIClass",
    [
      m("begin", "", "Initialize the SPI bus."),
      m("end", "", "Disable the SPI bus."),
      m(
        "beginTransaction",
        "settings=SPISettings(1000000, MSBFIRST, SPI_MODE0)",
        "Configure an SPI transaction.",
      ),
      m("endTransaction", "", "End the current transaction."),
      m("transfer", "value", "Send and receive one byte."),
      m("transfer16", "value", "Send and receive 16 bits."),
    ],
    {
      global: "SPI",
      constants: ["SPI_MODE0", "SPI_MODE1", "SPI_MODE2", "SPI_MODE3"],
      url: "https://docs.arduino.cc/language-reference/en/functions/communication/SPI/",
    },
  ),
  library(
    "Stepper.h",
    "Stepper",
    [
      m("setSpeed", "rpm=60", "Set speed in revolutions per minute."),
      m(
        "step",
        "steps=200",
        "Move a number of steps; negative reverses direction.",
      ),
    ],
    {
      declaration:
        "Stepper ${1:motor}(${2:200}, ${3:8}, ${4:9}, ${5:10}, ${6:11});${0}",
      url: "https://docs.arduino.cc/libraries/stepper/",
    },
  ),
  library(
    "SoftwareSerial.h",
    "SoftwareSerial",
    [
      ...serialMethods.filter((x) => !["availableForWrite"].includes(x.label)),
      m("listen", "", "Select this instance as the active receiver."),
      m("isListening", "", "Check if this instance is receiving."),
      m("overflow", "", "Check and clear receive-buffer overflow."),
    ],
    {
      declaration: "SoftwareSerial ${1:port}(${2:2}, ${3:3});${0}",
      url: "https://docs.arduino.cc/learn/built-in-libraries/software-serial/",
    },
  ),
  library(
    "Adafruit_NeoPixel.h",
    "Adafruit_NeoPixel",
    [
      m("begin", "", "Initialize the pixel data pin."),
      m("show", "", "Send the buffered colors to the LEDs."),
      m("clear", "", "Set all buffered pixels to off."),
      m(
        "setPixelColor",
        "index=0,red=255,green=0,blue=0",
        "Set a buffered pixel color.",
      ),
      m("Color", "red=255,green=0,blue=0", "Pack RGB channels into a color."),
      m("setBrightness", "value=50", "Set global brightness from 0 to 255."),
      m("numPixels", "", "Return the configured pixel count."),
      m("getPixelColor", "index=0", "Read a buffered pixel color."),
    ],
    {
      declaration:
        "Adafruit_NeoPixel ${1:pixels}(${2:8}, ${3:6}, ${4:NEO_GRB + NEO_KHZ800});${0}",
      constants: ["NEO_GRB", "NEO_RGB", "NEO_KHZ800", "NEO_KHZ400"],
      url: "https://learn.adafruit.com/adafruit-neopixel-uberguide/arduino-library-use",
    },
  ),
  library(
    "Keypad.h",
    "Keypad",
    [
      m("getKey", "", "Return a newly pressed key or NO_KEY."),
      m("getKeys", "", "Update the list of active keys."),
      m("waitForKey", "", "Wait for a key press (blocking)."),
      m("setDebounceTime", "ms=50", "Set the debounce period."),
      m("setHoldTime", "ms=500", "Set the long-press duration."),
      m("addEventListener", "handler", "Register a key-event callback."),
    ],
    {
      constants: ["NO_KEY", "PRESSED", "RELEASED", "HOLD", "IDLE"],
      url: "https://docs.arduino.cc/libraries/keypad/",
    },
  ),
  library(
    "SD.h",
    "SDClass",
    [
      m("begin", "pin=10", "Initialize an SD card with the chip-select pin."),
      m(
        "open",
        'filename="data.txt",mode=FILE_READ',
        "Open a file; check the returned File.",
      ),
      m("exists", 'filename="data.txt"', "Check if a file exists."),
      m("remove", 'filename="data.txt"', "Remove a file."),
      m("mkdir", 'path="logs"', "Create a directory."),
      m("rmdir", 'path="logs"', "Remove an empty directory."),
    ],
    {
      global: "SD",
      constants: ["FILE_READ", "FILE_WRITE"],
      url: "https://docs.arduino.cc/libraries/sd/",
    },
  ),
];
const lcd = libraries.find((l) => l.type === "LiquidCrystal");
libraries.push(
  library(
    "LiquidCrystal_I2C.h",
    "LiquidCrystal_I2C",
    [
      m("init", "", "Initialize this I2C LCD variant."),
      m("backlight", "", "Turn on the backlight."),
      m("noBacklight", "", "Turn off the backlight."),
      ...lcd.methods.filter((m) => m.label !== "begin"),
    ],
    {
      declaration:
        "LiquidCrystal_I2C ${1:lcd}(${2:0x27}, ${3:16}, ${4:2});${0}",
      url: "https://docs.arduino.cc/libraries/liquidcrystal-i2c/",
      details:
        "LiquidCrystal_I2C APIs differ between releases; this catalog covers the common init()/backlight() variant.",
    },
  ),
);
export const fileMethods = [
  ...printMethods,
  m("available", "", "Count bytes available to read."),
  m("read", "", "Read the next byte."),
  m("close", "", "Close the file."),
  m("flush", "", "Write pending data."),
  m("size", "", "Return the file size."),
  m("position", "", "Return the current file offset."),
  m("seek", "position=0", "Move to a byte offset."),
];
