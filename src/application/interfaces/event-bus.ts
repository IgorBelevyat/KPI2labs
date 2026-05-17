import { IntegrationEvent } from '../../domain/events/integration-events';

export interface EventBus {
  publish(event: IntegrationEvent): Promise<void>;
  subscribe(eventType: string, handler: (event: IntegrationEvent) => Promise<void>): void;
}
