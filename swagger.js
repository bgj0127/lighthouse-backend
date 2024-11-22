const swaggerAutogen = require("swagger-autogen")({ language: "ko" });

const doc = {
  info: {
    title: "E-Room API Document",
    description: "해당 문서를 통해 어떤 데이터를 요청해야하는지, 어떤 데이터가 응답되는지 확인할 수 있습니다.",
  },
  host: "http://localhost:3080",
  schemes: ["http"],
};

const outputFile = "./swagger-output.json";
const endpointFiles = ["./server.js"];

swaggerAutogen(outputFile, endpointFiles, doc);
