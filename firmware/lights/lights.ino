// Bedroom lights ESP32-C3 firmware — 2 relays, controlled from the web (EMQX) and from wall switches.
//
// Flow: WiFi -> MQTT/TLS (EMQX 8883) -> subscribe progreso/7a/light/recamara/+
//       -> on {action:"on"|"off"} for relay 1 or 2, set that relay.
// Wall switches (rockers) toggle their relay on every flip, up or down.
//
// Same robustness as garage.ino: requestId dedup + ts staleness check.
// Lights boot OFF after a power cut (relays released); the switches' boot position is just the baseline.
// The wall switches keep working with no WiFi/MQTT — reconnects never block for long.
//
// Wiring (ESP32-C3 Super Mini, 2-channel relay module, HLK-PM01 5V):
//   HLK-PM01 +Vo -> 5V pin of the C3 and VCC of the relay module
//   HLK-PM01 -Vo -> GND of the C3 and GND of the relay module
//   GPIO3 -> IN1 (light 1), GPIO4 -> IN2 (light 2)   (module is active-LOW)
//   Wall switch 1: GPIO5 <-> GND, wall switch 2: GPIO6 <-> GND   (disconnected from 120V!)
//   Each light: live wire -> COM, NO -> lamp (NO = off when the relay is idle).

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include <driver/gpio.h>
#include "secrets.h"

// ---- config you may want to tweak ---------------------------------------
static const int   RELAY_PINS[] = {3, 4};           // light 1, light 2 (avoid 2/8/9: strapping pins)
static const int   SWITCH_PINS[] = {5, 6};          // wall switch for light 1, light 2 (to GND, INPUT_PULLUP)
static const int   LIGHTS = 2;
static const int   DEBOUNCE_MS = 50;                 // a switch must hold its new position this long
static const int   LED_PIN  = 8;                     // C3 Super Mini onboard LED (active LOW)
static const bool  RELAY_ACTIVE_LOW = true;          // most 2-ch relay modules trigger on LOW; flip if inverted
static const long  STALE_MS = 30000;                 // reject commands older than this
static const int   SEEN_SIZE = 8;                    // how many recent requestIds to remember
// -------------------------------------------------------------------------

static const char* MQTT_HOST = "jc748298.ala.us-east-1.emqxsl.com";
static const int   MQTT_PORT = 8883;
#define BASE "progreso/7a/light/recamara"           // this board's lights; must match src/lib/devices.ts
static const char* TOPIC     = BASE "/+";            // commands: BASE/<n>

// EMQX Serverless TLS root (DigiCert Global Root G2 = emqxsl-ca.crt).
static const char* CA_CERT = R"EOF(
-----BEGIN CERTIFICATE-----
MIIDjjCCAnagAwIBAgIQAzrx5qcRqaC7KGSxHQn65TANBgkqhkiG9w0BAQsFADBh
MQswCQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMRkwFwYDVQQLExB3
d3cuZGlnaWNlcnQuY29tMSAwHgYDVQQDExdEaWdpQ2VydCBHbG9iYWwgUm9vdCBH
MjAeFw0xMzA4MDExMjAwMDBaFw0zODAxMTUxMjAwMDBaMGExCzAJBgNVBAYTAlVT
MRUwEwYDVQQKEwxEaWdpQ2VydCBJbmMxGTAXBgNVBAsTEHd3dy5kaWdpY2VydC5j
b20xIDAeBgNVBAMTF0RpZ2lDZXJ0IEdsb2JhbCBSb290IEcyMIIBIjANBgkqhkiG
9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuzfNNNx7a8myaJCtSnX/RrohCgiN9RlUyfuI
2/Ou8jqJkTx65qsGGmvPrC3oXgkkRLpimn7Wo6h+4FR1IAWsULecYxpsMNzaHxmx
1x7e/dfgy5SDN67sH0NO3Xss0r0upS/kqbitOtSZpLYl6ZtrAGCSYP9PIUkY92eQ
q2EGnI/yuum06ZIya7XzV+hdG82MHauVBJVJ8zUtluNJbd134/tJS7SsVQepj5Wz
tCO7TG1F8PapspUwtP1MVYwnSlcUfIKdzXOS0xZKBgyMUNGPHgm+F6HmIcr9g+UQ
vIOlCsRnKPZzFBQ9RnbDhxSJITRNrw9FDKZJobq7nMWxM4MphQIDAQABo0IwQDAP
BgNVHRMBAf8EBTADAQH/MA4GA1UdDwEB/wQEAwIBhjAdBgNVHQ4EFgQUTiJUIBiV
5uNu5g/6+rkS7QYXjzkwDQYJKoZIhvcNAQELBQADggEBAGBnKJRvDkhj6zHd6mcY
1Yl9PMWLSn/pvtsrF9+wX3N3KjITOYFnQoQj8kVnNeyIv/iPsGEMNKSuIEyExtv4
NeF22d+mQrvHRAiGfzZ0JFrabA0UWTW98kndth/Jsw1HKj2ZL7tcu7XUIOGZX1NG
Fdtom/DzMNU+MeKNhJ7jitralj41E6Vf8PlwUHBHQRFXGU7Aj64GxJUTFy8bJZ91
8rGOmaFvE7FBcf6IKshPECBV1/MUReXgRPTqh5Uykw7+U0b6LJ3/iyK5S9kJRaTe
pLiaWN0bfVKfjllDiIGknibVb63dDcY3fe0Dkhvld1927jyNxF1WW6LZZm6zNTfl
MrY=
-----END CERTIFICATE-----
)EOF";

WiFiClientSecure net;
PubSubClient mqtt(net);

String seen[SEEN_SIZE];
int seenIdx = 0;

// set by the MQTT callback, applied in loop() — keep the callback fast.
volatile int pendingLight = -1;
volatile bool pendingOn = false;

bool lightOn[LIGHTS];      // what the relays are doing right now
bool swStable[LIGHTS];     // debounced switch position
bool swRaw[LIGHTS];        // last raw reading
unsigned long swSince[LIGHTS];

bool alreadySeen(const String& id) {
  for (int i = 0; i < SEEN_SIZE; i++) if (seen[i] == id) return true;
  return false;
}
void remember(const String& id) {
  seen[seenIdx] = id;
  seenIdx = (seenIdx + 1) % SEEN_SIZE;
}

void setRelay(int i, bool on) {
  lightOn[i] = on;
  digitalWrite(RELAY_PINS[i], on != RELAY_ACTIVE_LOW ? HIGH : LOW);
}

// Rocker switches: any debounced change of position (either direction) toggles the light.
void pollSwitches() {
  for (int i = 0; i < LIGHTS; i++) {
    bool raw = digitalRead(SWITCH_PINS[i]);
    if (raw != swRaw[i]) { swRaw[i] = raw; swSince[i] = millis(); }
    if (raw != swStable[i] && millis() - swSince[i] >= DEBOUNCE_MS) {
      swStable[i] = raw;
      setRelay(i, !lightOn[i]);
      Serial.printf("LIGHT %d %s by wall switch\n", i + 1, lightOn[i] ? "on" : "off");
    }
  }
}

void onMessage(char* t, byte* payload, unsigned int len) {
  int n = atoi(strrchr(t, '/') + 1); // topic suffix: 1 or 2
  if (n < 1 || n > LIGHTS) { Serial.printf("ignore topic %s\n", t); return; }

  StaticJsonDocument<256> doc;
  if (deserializeJson(doc, payload, len)) { Serial.println("bad json"); return; }

  const char* action = doc["action"] | "";
  const char* reqId  = doc["requestId"] | "";
  long long ts       = doc["ts"] | 0LL;

  bool on = strcmp(action, "on") == 0;
  if (!on && strcmp(action, "off") != 0) { Serial.printf("ignore action=%s\n", action); return; }

  String id(reqId);
  if (id.length() && alreadySeen(id)) { Serial.println("dup requestId, ignored"); return; }

  time_t now = time(nullptr);
  if (now > 1700000000) { // clock looks synced
    long long ageMs = (long long)now * 1000 - ts;
    if (ageMs > STALE_MS || ageMs < -STALE_MS) {
      Serial.printf("stale command (age %lldms), ignored\n", ageMs);
      return;
    }
  } else {
    Serial.println("warning: clock not synced, skipping staleness check");
  }

  if (id.length()) remember(id);
  Serial.printf("LIGHT %d %s by %s\n", n, action, (const char*)(doc["by"] | "?"));
  pendingOn = on;
  pendingLight = n - 1;
}

// Never block here for long: the wall switches are polled in the same loop.
// ponytail: no reboot-on-stuck like garage.ino — a reboot would turn the lights off. Add one with
// RTC-memory state restore if the WiFi stack ever wedges for good.
void connectMqtt() {
  static unsigned long lastTry = 0;
  if (WiFi.status() != WL_CONNECTED || millis() - lastTry < 5000) return; // WiFi reconnects on its own
  lastTry = millis();
  String cid = "bedroom-lights-" + String((uint32_t)ESP.getEfuseMac(), HEX);
  Serial.print("mqtt...");
  if (mqtt.connect(cid.c_str(), MQTT_USER, MQTT_PASS)) { // blocks ~1-2s for TLS; switches wait that long at most
    mqtt.subscribe(TOPIC, 1);
    Serial.printf("ok, subscribed %s\n", TOPIC);
  } else {
    Serial.printf("failed rc=%d, retry in 5s\n", mqtt.state());
  }
}

void setup() {
  // Relays first: latch the "off" level, then enable the output, so they never click on at boot.
  // (gpio_set_level, not digitalWrite: the Arduino core ignores digitalWrite before pinMode.)
  for (int i = 0; i < LIGHTS; i++) {
    gpio_set_level((gpio_num_t)RELAY_PINS[i], RELAY_ACTIVE_LOW ? 1 : 0);
    pinMode(RELAY_PINS[i], OUTPUT);
    lightOn[i] = false;
  }
  // Switch position at boot is the baseline, not a flip.
  for (int i = 0; i < LIGHTS; i++) {
    pinMode(SWITCH_PINS[i], INPUT_PULLUP);
    delay(2); // let the pull-up settle
    swRaw[i] = swStable[i] = digitalRead(SWITCH_PINS[i]);
  }
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH); // LED off
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  configTime(0, 0, "pool.ntp.org", "time.nist.gov"); // syncs once WiFi is up; for the staleness check
  net.setCACert(CA_CERT);
  net.setHandshakeTimeout(5);
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(onMessage);
}

void loop() {
  pollSwitches();
  if (!mqtt.connected()) connectMqtt();
  mqtt.loop();
  if (pendingLight >= 0) {
    setRelay(pendingLight, pendingOn);
    pendingLight = -1;
    digitalWrite(LED_PIN, LOW); delay(100); digitalWrite(LED_PIN, HIGH); // ack blink
  }
}
