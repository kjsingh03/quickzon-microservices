export { RABBITMQ_URL } from "./config.js";

export { receiveMail, } from "./direct/consumer-direct2.js";
export { receiveMail2, } from "./direct/consumer-direct.js";
export { sendMail, } from "./direct/producer-direct.js";