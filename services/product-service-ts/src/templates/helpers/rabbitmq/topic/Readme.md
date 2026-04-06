# Run Instructions

1. Ensure RabbitMQ is running on `localhost:5672`
2. Build project:
   npm run build
3. Open 3 terminals and navigate:
   cd dist/templates/helpers/rabbitmq/topic
4. Run files:
   node consumer-topic.js
   node consumer-topic2.js
   node producer-topic.js