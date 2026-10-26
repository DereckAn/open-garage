// The one list of devices. The page groups them by room; /api/device/[id] only publishes to these topics.
// Adding a device = add a line here + flash a board that subscribes to its topic.
//   door:  momentary toggle  → {action:"toggle"}
//   light: explicit on/off   → {action:"on"|"off"}
// Light topics are progreso/7a/light/<board>/<relay>; each board subscribes to its own <board>/+.
// ids are only URL keys — rename freely, but never reuse one for a different device.

export type Device = { id: string; type: 'door' | 'light'; room: string; name: string; topic: string };

export const DEVICES: Device[] = [
  { id: 'garage',     type: 'door',  room: 'Garage',   name: 'Puerta principal', topic: 'progreso/7a/garagedoor/1' },
  { id: 'recamara-1', type: 'light', room: 'Recámara', name: 'Luz del techo',    topic: 'progreso/7a/light/recamara/1' },
  { id: 'recamara-2', type: 'light', room: 'Recámara', name: 'Luz 2',            topic: 'progreso/7a/light/recamara/2' },
];

export const byRoom = Map.groupBy(DEVICES, (d) => d.room);
