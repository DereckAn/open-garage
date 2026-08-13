# Garage ESP32 firmware — build & flash (through a Flipper Zero bridge)

Subscribes to EMQX (`progreso/7a/garagedoor/1`) over MQTT/TLS and pulses a relay on
`{"action":"toggle"}`. See `garage/garage.ino`.

## 0. Wiring (ESP32 ↔ Flipper as USB-UART bridge)
On the Flipper: **GPIO → USB-UART Bridge**, baud **115200**, connect to **USB UART** (pins 13 TX / 14 RX).

| ESP32 | Flipper GPIO |
|-------|--------------|
| GND   | GND (pin 18/8) |
| TX0   | pin 14 (RX)  |
| RX0   | pin 13 (TX)  |
| GPIO0 (BOOT) | tie to a button→GND for bootloader mode |
| EN/RST | button→GND to reset |

The Flipper bridge has **no DTR/RTS**, so auto-reset doesn't work → you enter the
bootloader **by hand**: hold BOOT (GPIO0→GND), tap EN/RST, release BOOT.

> `/dev/ttyACM0` is root-owned here. If a command says "permission denied", prefix it
> with `sudo`, or add yourself: `sudo usermod -aG uucp $USER` then re-login.

## 1. Install tools
Arch/CachyOS — both tools from the repo:
```sh
sudo pacman -S esptool arduino-cli
```
Then (no sudo):
```sh
arduino-cli config init
arduino-cli core update-index
arduino-cli core install esp32:esp32
arduino-cli lib install PubSubClient ArduinoJson
```

## 2. Identify the chip
Put the ESP32 in bootloader (hold BOOT, tap EN, release BOOT), then:
```sh
esptool --port /dev/ttyACM0 --before no_reset --after no_reset flash_id
```
The output line `Detecting chip type... ESP32` / `ESP32-S3` / `ESP32-C3` gives your chip.
Map it to an FQBN:

| Chip | FQBN |
|------|------|
| ESP32 (classic) | `esp32:esp32:esp32` |
| ESP32-S3 | `esp32:esp32:esp32s3` |
| ESP32-C3 | `esp32:esp32:esp32c3` |

## 3. Secrets
```sh
cp garage/secrets.h.example garage/secrets.h
# edit garage/secrets.h — WiFi + EMQX MQTT username/password
```
The **MQTT username/password** come from the EMQX console → **Authentication** section
(create one if none). These are different from the REST App ID/Secret.

## 4. Compile
```sh
arduino-cli compile --fqbn esp32:esp32:esp32 garage   # swap FQBN for your chip
```

## 5. Flash (manual bootloader, no auto-reset)
Build the whole-flash image, then write it as one file at 0x0. The Flipper bridge can't
auto-reset, so enter the bootloader by hand first.
```sh
arduino-cli compile --fqbn esp32:esp32:esp32 --output-dir build garage
# enter bootloader: hold GPIO0->GND, tap EN->GND, release EN, release GPIO0
esptool --port /dev/ttyACM0 --before no-reset --after no-reset \
  write-flash 0x0 build/garage.ino.merged.bin
```
When it finishes, tap EN to boot the new firmware.

## 6. Watch it run
```sh
esptool version >/dev/null   # ensure port is free
arduino-cli monitor -p /dev/ttyACM0 -c baudrate=115200
```
Expect: `wifi ok <ip>` → `mqtt... ok, subscribed progreso/7a/garagedoor/1`.
Now press **Activar** in the web app → serial prints `TOGGLE by <email>` and the relay clicks.
(While the ESP32 is subscribed, the web publish returns 200 instead of 202.)
```
```

## Notes
- Firmware is chip-agnostic; only the FQBN and `--chip` differ per board.
- `RELAY_PIN`, `RELAY_ACTIVE_LOW`, `PULSE_MS` are at the top of `garage.ino` — set them to
  your relay wiring before flashing.
