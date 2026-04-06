export { RABBITMQ_URL } from "./config.js";

export { receiveMail, } from "./rabbitmq/direct/consumer-direct2.js";
export { receiveMail2, } from "./rabbitmq/direct/consumer-direct.js";
export { sendMail, } from "./rabbitmq/direct/producer-direct.js";