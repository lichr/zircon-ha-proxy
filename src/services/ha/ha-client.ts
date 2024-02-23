import EventEmitter from 'eventemitter3';
import _ from 'lodash';
import { makeSlug } from '../../tools';
import { IMpiDevice, IMpiState } from '../mpi';
import { haDeviceToDevice, haEntityToMetric, haStateToState } from './convert';
import { HaUpstreamConnection } from './ha-upstream-connection';

/**
 * High level logics for communication with Home Assistant.
 */
export class HaClient {
  emitter: EventEmitter = new EventEmitter();
  connection: HaUpstreamConnection;

  constructor(
    url: string,
    accessToken: string
  ) {
    this.connection = new HaUpstreamConnection(url, accessToken);
    this.connection.emitter.on('connect', this.onConnect);
    this.connection.emitter.on('event', this.onEvent);
  }

  onConnect = () => {
    // subscript events
    this.connection.subscribeEvents('state_changed');
    // other events:
    // area_registry_updated
    // entity_registry_updated
    // device_registry_updated
  }

  onEvent = (event: any) => {
    if (event.event_type === 'state_changed') {
      const entity_id = event.data.entity_id;
      const state = haStateToState(event.data.new_state);
      this.emitter.emit(
        'event',
        {
          type: 'state_changed',
          data: {
            states: { [entity_id]: state }
          }
        }
      );
    }
  }

  async getStates(): Promise<Record<string, IMpiState>> {
    const stateList = (await this.connection.command({ type: 'get_states' })).result;

    return _.mapValues(
      _.keyBy(
        stateList,
        'entity_id'
      ),
      (state) => haStateToState(state)
    );
  }

  async getDevices(): Promise<Record<string, IMpiDevice>> {
    const deviceList = (await this.connection.command({ type: 'config/device_registry/list' })).result;
    const entityList = (await this.connection.command({ type: 'config/entity_registry/list' })).result;
    const stateList = (await this.connection.command({ type: 'get_states' })).result;

    // make devices
    const devices = _.keyBy(
      _.filter(
        _.map(
          deviceList,
          haDeviceToDevice
        ),
        // exclude Home Assistant devices
        (device) => device !== null
      ),
      'id'
    ) as Record<string, IMpiDevice>;

    // make metrics
    const metrics: Record<string, any> = {};
    _.forEach(entityList, (entity: any) => {
      const device = devices[entity.device_id];
      if (device) {
        const metric = haEntityToMetric(entity, device.name);
        if (metric) {
          device.metrics[metric.id] = metric;
          metrics[metric.uid] = metric;
        }
      }
    });

    // make states
    _.forEach(stateList, (state: any) => {
      const entity_id = state.entity_id;
      const metric = metrics[entity_id];
      if (metric) {
        const s = haStateToState(state)
        metric.type = s.type;
        metric.state = s;
      }
    });

    // return
    return devices;
  };

  async getRawDevices(): Promise<any> {
    const deviceList = (await this.connection.command({ type: 'config/device_registry/list' })).result;
    const entityList = (await this.connection.command({ type: 'config/entity_registry/list' })).result;
    const stateList = (await this.connection.command({ type: 'get_states' })).result;

    const devices = _.keyBy(
      _.map(
        deviceList,
        (device: any) => {
          return {
            device,
            entities: {} as Record<string, any>
          }
        }
      ),
      'device.id'
    );

    const entities: Record<string, any> = {};
    _.forEach(entityList, (entity: any) => {
      const device = devices[entity.device_id];
      if (device) {
        const id = makeSlug(entity.name ?? entity.original_name ?? '');
        const en = {
          entity,
          state: {}
        }
        device.entities[id] = en;
        entities[entity.entity_id] = en;
      }
    });

    _.forEach(stateList, (state: any) => {
      const entity_id = state.entity_id;
      const entity = entities[entity_id];
      if (entity) {
        entity.state = state
      }
    });

    return devices;
  };
}
