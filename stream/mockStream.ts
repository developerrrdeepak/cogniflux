export function publishCognitiveSignal(signal: any) {
  console.log("Streaming to Confluent topic: cognitive-signals", signal);
  
  // Mock Kafka producer
  return {
    topic: "cognitive-signals",
    partition: 0,
    offset: Date.now(),
    signal
  };
}