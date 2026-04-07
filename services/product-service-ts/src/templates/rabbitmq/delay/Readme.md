# Run Instructions

1. Ensure RabbitMQ is running on `localhost:5672`
2. Build project:
   npm run build
3. Open terminals and navigate:
   cd dist/templates/rabbitmq/delay
4. Run files:
   node consumer.js
   node producer.js