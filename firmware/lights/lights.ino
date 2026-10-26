// Bedroom lights ESP32-C3 firmware — subscribes to EMQX and switches 2 relays on/off.
//
// Flow: WiFi -> MQTT/TLS (EMQX 8883) -> subscribe progreso/7a/light/+
//       -> on {action:"on"|"off"} for light 1 or 2, set that relay.
//
// Same robustness as garage.ino: requestId dedup + ts staleness check.
// Lights boot OFF after a power cut (relays released).
//
// Wiring (ESP32-C3 Super Mini, 2-channel relay module, HLK-PM01 5V):
//   HLK-PM01 +Vo -> 5V pin of the C3 and VCC of the relay module
//   HLK-PM01 -Vo -> GND of the C3 and GND of the relay module
//   GPIO3 -> IN1 (light 1), GPIO4 -> IN2 (light 2)
//   Each light: live wire -> COM, NO -> lamp (NO = off when the relay is idle).

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include "secrets.h"

// ---- config you may want to tweak ---------------------------------------
static const int   RELAY_PINS[] = {3, 4};           // light 1, light 2 (avoid 2/8/9: strapping pins)
static const int   LIGHTS = 2;
static const int   LED_PIN  = 8;                     // C3 Super Mini onboard LED (active LOW)
static const bool  RELAY_ACTIVE_LOW = true;          // most 2-ch relay modules trigger on LOW; flip if inverted
static const long  STALE_MS = 30000;                 // reject commands older than this
static const int   SEEN_SIZE = 8;                    // how many recent requestIds to remember
// -------------------------------------------------------------------------

static const char* MQTT_HOST = "jc748298.ala.us-east-1.emqxsl.com";
static const int   MQTT_PORT = 8883;
static const char* TOPIC     = "progreso/7a/light/+";

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

bool alreadySeen(const String& id) {
  for (int i = 0; i < SEEN_SIZE; i++) if (seen[i] == id) return true;
  return false;
}
void remember(const String& id) {
  seen[seenIdx] = id;
  seenIdx = (seenIdx + 1) % SEEN_SIZE;
}

void setRelay(int i, bool on) {
  digitalWrite(RELAY_PINS[i], on != RELAY_ACTIVE_LOW ? HIGH : LOW);
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

void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("wifi");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    // ponytail: reboot is the recovery — same as garage.ino
    if (millis() - start > 30000) { Serial.println(" timeout, rebooting"); ESP.restart(); }
    delay(400); Serial.print(".");
  }
  Serial.printf(" ok %s\n", WiFi.localIP().toString().c_str());
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
}

void connectMqtt() {
  String cid = "bedroom-lights-" + String((uint32_t)ESP.getEfuseMac(), HEX);
  int fails = 0;
  while (!mqtt.connected()) {
    if (WiFi.status() != WL_CONNECTED || ++fails > 20) { Serial.println("mqtt stuck, rebooting"); ESP.restart(); }
    Serial.print("mqtt...");
    if (mqtt.connect(cid.c_str(), MQTT_USER, MQTT_PASS)) {
      mqtt.subscribe(TOPIC, 1);
      Serial.printf("ok, subscribed %s\n", TOPIC);
    } else {
      Serial.printf("failed rc=%d, retry in 3s\n", mqtt.state());
      delay(3000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH); // LED off
  for (int i = 0; i < LIGHTS; i++) { pinMode(RELAY_PINS[i], OUTPUT); setRelay(i, false); }
  connectWifi();
  net.setCACert(CA_CERT);
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(onMessage);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWifi();
  if (!mqtt.connected()) connectMqtt();
  mqtt.loop();
  if (pendingLight >= 0) {
    setRelay(pendingLight, pendingOn);
    pendingLight = -1;
    digitalWrite(LED_PIN, LOW); delay(100); digitalWrite(LED_PIN, HIGH); // ack blink
  }
}
