const swaggerAutogen = require("swagger-autogen")();

const outputFile = "./swagger.json";
const endpointsFiles = ["./Routes/admin.js", "./Routes/user.js"];

swaggerAutogen(outputFile, endpointsFiles);
// swaggerAutogen(outputFile, endpointsFiles).then(() => {
//   require("./app");
// });
