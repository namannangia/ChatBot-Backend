const faker = require('faker');

// Generate a random first and last name
const firstName = faker.name.firstName();
const lastName = faker.name.lastName();

console.log(`${firstName} ${lastName}`); // outputs something like "John Smith"
