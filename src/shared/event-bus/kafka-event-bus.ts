import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { EventBus } from './event-bus.interface';
import { IntegrationEvent } from '../../domain/events/integration-events';

const TOPIC = 'booking-events';

export class KafkaEventBus implements EventBus {
  private producer: Producer;
  private consumer: Consumer;
  private handlers: Map<string, Array<(event: IntegrationEvent) => Promise<void>>> = new Map();

  constructor(private readonly kafka: Kafka, private readonly groupId: string = 'notification-group') {
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId });
  }

  async connect(): Promise<void> {
    await this.producer.connect();
    console.log('[KafkaEventBus] Producer connected');

    await this.consumer.connect();
    await this.consumer.subscribe({ topic: TOPIC, fromBeginning: false });

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        const { message } = payload;
        if (!message.value) return;

        try {
          const event: IntegrationEvent = JSON.parse(message.value.toString());
          const eventHandlers = this.handlers.get(event.type) || [];

          for (const handler of eventHandlers) {
            try {
              await handler(event);
            } catch (err) {
              console.error(`[KafkaEventBus] Handler error for ${event.type}:`, err);
            }
          }
        } catch (err) {
          console.error('[KafkaEventBus] Failed to parse message:', err);
        }
      },
    });

    console.log('[KafkaEventBus] Consumer listening on topic:', TOPIC);
  }

  async publish(event: IntegrationEvent): Promise<void> {
    await this.producer.send({
      topic: TOPIC,
      messages: [
        {
          key: event.type,
          value: JSON.stringify(event),
        },
      ],
    });
    console.log(`[KafkaEventBus] Published: ${event.type}`);
  }


  subscribe(eventType: string, handler: (event: IntegrationEvent) => Promise<void>): void {
    const existing = this.handlers.get(eventType) || [];
    existing.push(handler);
    this.handlers.set(eventType, existing);
    console.log(`[KafkaEventBus] Subscribed to: ${eventType}`);
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
    await this.consumer.disconnect();
    console.log('[KafkaEventBus] Disconnected');
  }
}
