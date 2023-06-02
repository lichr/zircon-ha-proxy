
export interface IMpiDevice {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
  metrics: Record<string, IMpiMetric>;
}

export interface IMpiMetric {
  id: string;
  uid: string;
  name: string;
  state: IMpiState | null;
}

export interface IMpiState {
  type: string;
  class: string;
  value: any;
  last_changed: string;
  unit: string;
}

export interface IMpiStateEntry {
  metricUid: string;
  state: IMpiState;
}

export interface IMpiEvent<T> {
  type: string;
  data: T;
}
