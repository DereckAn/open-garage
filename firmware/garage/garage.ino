// Garage door ESP32 firmware — subscribes to EMQX and pulses a relay on "toggle".
//
// Flow: WiFi -> MQTT/TLS (EMQX 8883) -> subscribe progreso/7a/garagedoor/<id>
//       -> on {action:"toggle"} pulse the relay (momentary "button press").
//
// Robustness (matches the web app's command contract):
//   - requestId dedup: ignores a command id we've already acted on (kills the
//     QoS-1 double-delivery double-toggle).
//   - ts staleness: ignores commands older than STALE_MS (replay protection).
//     Needs NTP time; if the clock isn't synced yet we act anyway but log it.
//
// Libraries (install via arduino-cli, see firmware/README.md):
//   PubSubClient, ArduinoJson.  WiFi + WiFiClientSecure are in the ESP32 core.
//
// Chip-agnostic: builds for classic ESP32, ESP32-S3, ESP32-C3, etc.

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include "secrets.h"

// ---- config you may want to tweak ---------------------------------------
static const char* DOOR_ID   = "1";                 // topic suffix; must match a web door id
static const int   RELAY_PIN = 4;                    // GPIO wired to the relay
static const bool  RELAY_ACTIVE_LOW = false;         // set true if your relay closes on LOW
static const int   PULSE_MS  = 400;                  // how long to "hold the button"
static const long  STALE_MS  = 30000;                // reject commands older than this
static const int   SEEN_SIZE = 8;                    // how many recent requestIds to remember
// -------------------------------------------------------------------------

static const char* MQTT_HOST = "jc748298.ala.us-east-1.emqxsl.com";
static const int   MQTT_PORT = 8883;

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
char topic[48];

// ring buffer of recently-acted requestIds
String seen[SEEN_SIZE];
int seenIdx = 0;

bool alreadySeen(const String& id) {
  for (int i = 0; i < SEEN_SIZE; i++) if (seen[i] == id) return true;
  return false;
}
void remember(const String& id) {
  seen[seenIdx] = id;
  seenIdx = (seenIdx + 1) % SEEN_SIZE;
}

void pulseRelay() {
  const int on  = RELAY_ACTIVE_LOW ? LOW : HIGH;
  const int off = RELAY_ACTIVE_LOW ? HIGH : LOW;
  digitalWrite(RELAY_PIN, on);
  delay(PULSE_MS);
  digitalWrite(RELAY_PIN, off);
}

void onMessage(char* t, byte* payload, unsigned int len) {
  StaticJsonDocument<256> doc;
  if (deserializeJson(doc, payload, len)) { Serial.println("bad json"); return; }

  const char* action = doc["action"] | "";
  const char* reqId  = doc["requestId"] | "";
  long long ts       = doc["ts"] | 0LL;

  if (strcmp(action, "toggle") != 0) { Serial.printf("ignore action=%s\n", action); return; }

  String id(reqId);
  if (id.length() && alreadySeen(id)) { Serial.println("dup requestId, ignored"); return; }

  // staleness check (needs NTP; skip if clock not synced yet)
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
  Serial.printf("TOGGLE by %s\n", (const char*)(doc["by"] | "?"));
  pulseRelay();
}

void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("wifi");
  while (WiFi.status() != WL_CONNECTED) { delay(400); Serial.print("."); }
  Serial.printf(" ok %s\n", WiFi.localIP().toString().c_str());
  configTime(0, 0, "pool.ntp.org", "time.nist.gov"); // UTC; for staleness check
}

void connectMqtt() {
  String cid = "garage-door-" + String(DOOR_ID) + "-" + String((uint32_t)ESP.getEfuseMac(), HEX);
  while (!mqtt.connected()) {
    Serial.print("mqtt...");
    if (mqtt.connect(cid.c_str(), MQTT_USER, MQTT_PASS)) {
      mqtt.subscribe(topic, 1); // QoS 1
      Serial.printf("ok, subscribed %s\n", topic);
    } else {
      Serial.printf("failed rc=%d, retry in 3s\n", mqtt.state());
      delay(3000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, RELAY_ACTIVE_LOW ? HIGH : LOW); // start released
  snprintf(topic, sizeof(topic), "progreso/7a/garagedoor/%s", DOOR_ID);
  connectWifi();
  net.setCACert(CA_CERT);
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(onMessage);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWifi();
  if (!mqtt.connected()) connectMqtt();
  mqtt.loop();
}
