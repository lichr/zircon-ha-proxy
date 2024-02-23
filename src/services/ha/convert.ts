import { makeSlug } from "../../tools";
import { IMpiDevice, IMpiMetric, IMpiState, makeTagsByName } from "../mpi";

export function haStateToState(haState: any): IMpiState {
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
    type: state_class === 'measurement' || unit_of_measurement ? 'number' : 'string',
    class: device_class,
    value,
    last_changed: last_changed,
    unit: unit_of_measurement    
  }
}

export function haDeviceToDevice(haDevice: any): IMpiDevice | null {
  const { id, name, model, manufacturer } = haDevice;
  const tags = makeTagsByName(name);

  if (manufacturer === 'Home Assistant' || model === 'Home Assistant Add-on') {
    return null;
  }

  return {
    id,
    name,
    model,
    manufacturer,
    tags,
    metrics: {} as Record<string, any>
  };
}

export function haEntityToMetric(haEntity: any, deviceName?: string): IMpiMetric | null {
  let name = haEntity.name ?? haEntity.original_name ?? '';
  name = name === deviceName ? name : name.replace(deviceName, '').trim();
  name = name.replace(/\sSensor$/, '');
  const id = makeSlug(name);
  const tags = makeTagsByName(name);

  // filter metric
  const s = name.toLocaleLowerCase();
  if (s === 'identify') {
    return null;
  }

  return {
    id,
    uid: haEntity.entity_id,
    name,
    type: 'string',
    tags,
    state: null
  }
}

