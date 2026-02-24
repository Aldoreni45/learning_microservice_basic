import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "kafka-admin",
  brokers: ["127.0.0.1:9092"],
});

const admin = kafka.admin();

const run = async () => {
  try {
    console.log("Connecting to Kafka...");
    await admin.connect();
    console.log("Connected successfully!");
    
    console.log("Creating topics...");
    await admin.createTopics({
      topics: [
        { topic: "payment-successful" },
        { topic: "order-successful" },
        { topic: "email-successful" },
      ],
    });
    console.log("Topics created successfully!");
    
    await admin.disconnect();
    console.log("Disconnected from Kafka");
  } catch (error) {
    console.error("Error:", error);
  }
};

run();
