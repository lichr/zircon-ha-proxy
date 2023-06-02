import { makeSlug } from "../tools";

export function haStateToState(haState: any): any {
  const {
    state: value,
    last_changed,
    attributes: {
      state_class,
      device_class,
      unit_of_measurement
    }
  } = haState;
  return {
    type: state_class === 'measurement' ? 'number' : 'string',
    class: device_class,
    value,
    last_changed: last_changed,
    unit: unit_of_measurement    
  }
}

export function haDeviceToDevice(haDevice: any): any {
  const { id, name, model, manufacturer } = haDevice;
  return {
    id,
    name,
    model,
    manufacturer,
    metrics: {} as Record<string, any>
  };
}

export function haEntityToMetric(haEntity: any, deviceName?: string): any {
  let name = haEntity.name ?? haEntity.original_name ?? '';
  name = name === deviceName ? name : name.replace(deviceName, '').trim();
  name = name.replace(/\sSensor$/, '');
  const id = makeSlug(name);
  return {
    id,
    uid: haEntity.entity_id,
    name,
    state: null
  }
}