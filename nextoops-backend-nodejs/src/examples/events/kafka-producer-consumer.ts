import { Kafka } from 'kafkajs';

/**
 * Example of Distributed Messaging using Kafka (kafkajs).
 * Used for high-throughput, fault-tolerant event streaming between microservices.
 */

const kafka = new Kafka({
    clientId: 'yozen-app',
    brokers: ['localhost:9092']
});

// --- PRODUCER ---
export async function produceMessage(topic: string, message: any) {
    const producer = kafka.producer();
    await producer.connect();
    await producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
    });
    await producer.disconnect();
}

// --- CONSUMER ---
export async function consumeMessages(topic: string) {
    const consumer = kafka.consumer({ groupId: 'yozen-group' });
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log({
                value: message.value?.toString(),
                topic,
                partition,
            });
        },
    });
}
