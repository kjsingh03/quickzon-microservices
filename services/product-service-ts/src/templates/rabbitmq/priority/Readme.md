# Run Instructions

1. Ensure RabbitMQ is running on `localhost:5672`
2. Build project:
   npm run build
3. Open terminals and navigate:
   cd dist/templates/rabbitmq/priority
4. Run files:
   node consumer.js
   node producer.js

⚠️ Note (Priority Queues):
Run the **producer before the consumer**, otherwise messages may be consumed too fast and priority ordering won’t be visible.