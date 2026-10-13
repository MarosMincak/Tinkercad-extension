# Implementation and catalog sources

Inspected October 13, 2026. Descriptions and examples are written for this extension; source headers are not copied into the product.

- [Arduino language reference](https://docs.arduino.cc/language-reference/)
- [Arduino AVR core declarations](https://github.com/arduino/ArduinoCore-avr/blob/master/cores/arduino/Arduino.h)
- [Servo API](https://github.com/arduino-libraries/Servo/blob/master/src/Servo.h)
- [LiquidCrystal API](https://github.com/arduino-libraries/LiquidCrystal/blob/master/src/LiquidCrystal.h)
- [Wire API](https://github.com/arduino/ArduinoCore-avr/blob/master/libraries/Wire/src/Wire.h)
- [EEPROM API](https://github.com/arduino/ArduinoCore-avr/blob/master/libraries/EEPROM/src/EEPROM.h)
- [SPI API](https://github.com/arduino/ArduinoCore-avr/blob/master/libraries/SPI/src/SPI.h)
- [SoftwareSerial API](https://github.com/arduino/ArduinoCore-avr/blob/master/libraries/SoftwareSerial/src/SoftwareSerial.h)
- [Stepper API](https://github.com/arduino-libraries/Stepper/blob/master/src/Stepper.h)
- [NeoPixel guide](https://learn.adafruit.com/adafruit-neopixel-uberguide/arduino-library-use)
- [Keypad library](https://docs.arduino.cc/libraries/keypad/)
- [SD library](https://docs.arduino.cc/libraries/sd/)
- [LiquidCrystal I2C](https://docs.arduino.cc/libraries/liquidcrystal-i2c/)
- [CodeMirror 4.7 source](https://github.com/codemirror/codemirror5/tree/4.7.0)
- [Lezer C++ grammar](https://github.com/lezer-parser/cpp) (MIT)
- [Chrome content scripts](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts)
- [Remote code restrictions](https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code)

The supplied Tinkercad circuit was inspected after sign-in. Its visible editor uses `.js-code_panel__texteditor .CodeMirror`. The loaded vendor asset explicitly reports CodeMirror `4.7.0` and assigns each instance to `wrapper.CodeMirror`. The circuit application sets mode `text/x-c++src` for Arduino, makes Blocks + Text read-only, and uses `swapDoc`/read-only state changes. Bundled catalog headers were selected from the library panel definitions in that same application asset. Asset URLs are versioned implementation details, not runtime dependencies.
