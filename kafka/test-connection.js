import { Kafka } from "kafkajs";

console.log("Testing connection to Kafka...");

const kafka = new Kafka({
  clientId: "test-client",
  brokers: ["127.0.0.1:9092"],
  connectionTimeout: 3000,
  requestTimeout: 3000,
});

try {
  console.log("Attempting to connect...");
  const admin = kafka.admin();
  await admin.connect();
  console.log("Connected successfully!");
  
  // Test basic operation
  const metadata = await admin.fetchTopicMetadata();
  console.log("Metadata fetched:", metadata);
  
  await admin.disconnect();
  console.log("Disconnected successfully");
} catch (error) {
  console.error("Connection failed:", error.message);
  console.error("Full error:", error);
}
