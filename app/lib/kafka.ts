import { Kafka, Producer } from "kafkajs";

let producer: Producer | null = null;

export async function getKafkaProducer() {
  if (producer) return producer;

  // Check if env vars are present
  const brokers = process.env.CONFLUENT_BOOTSTRAP_SERVER;
  const username = process.env.CONFLUENT_API_KEY;
  const password = process.env.CONFLUENT_API_SECRET;

  if (!brokers || !username || !password) {
    console.warn("Confluent credentials missing. Skipping Kafka connection.");
    return null;
  }

  try {
    const kafka = new Kafka({
      clientId: "cogniflux-app",
      brokers: [brokers],
      ssl: true,
      sasl: {
        mechanism: "plain",
        username,
        password,
      },
    });

    producer = kafka.producer();
    await producer.connect();
    console.log("Connected to Confluent Cloud");
    return producer;
  } catch (error) {
    console.error("Failed to connect to Confluent Kafka:", error);
    return null;
  }
}

export async function publishCognitiveEvent(memory: any, message: string) {
  const producer = await getKafkaProducer();
  
  if (!producer) {
    // Fallback/Mock behavior if no Kafka
    console.log("[MOCK KAFKA] Cognitive Event:", { memory, message });
    return;
  }

  try {
    await producer.send({
      topic: "cognitive-events",
      messages: [
        {
          key: memory.userLevel, // Key by user level for partitioning
          value: JSON.stringify({
            timestamp: new Date().toISOString(),
            confusionScore: memory.confusionScore,
            userLevel: memory.userLevel,
            signals: memory.detectedSignals,
            context: message.substring(0, 50) // Privacy: only snippet
          }),
        },
      ],
    });
    console.log("Event sent to Confluent");
  } catch (error) {
    console.error("Error sending to Kafka:", error);
  }
}
