const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    // swagger: "2.0",
    version: "1.0.0",
    title: "APIs Document",
    description: "your description here",
    // termsOfService: "",
    contact: {
      name: "test",
      email: "test@gmail.com",
      url: "test.com",
    },
    license: {
      name: "Apache 2.0",
      url: "https://www.apache.org/licenses/LICENSE-2.0.html",
    },
  },
  servers: [
    {
      url: "http://localhost:3000/api/v1",
      description: "Local server",
    },
    {
      url: "https://app-dev.herokuapp.com/api/v1",
      description: "DEV Env",
    },
    {
      url: "https://app-uat.herokuapp.com/api/v1",
      description: "UAT Env",
    },
  ],
  components: {
    schemas: {},
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  tags: [
    {
      name: "CRUD operations",
    },
  ],
  paths: {
    "/users": {
      get: {
        tags: ["CRUD operations"],
        description: "Get users",
        operationId: "getUsers",
        parameters: [
          {
            name: "x-company-id",
            in: "header",
            schema: {
              $ref: "#/components/schemas/companyId",
            },
            required: true,
            description: "Company id where the users work",
          },
          {
            name: "page",
            in: "query",
            schema: {
              type: "integer",
              default: 1,
            },
            required: false,
          },
          {
            name: "orderBy",
            in: "query",
            schema: {
              type: "string",
              enum: ["asc", "desc"],
              default: "asc",
            },
            required: false,
          },
        ],
        responses: {
          200: {
            description: "Users were obtained",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Users",
                },
              },
            },
          },
          400: {
            description: "Missing parameters",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
                example: {
                  message: "companyId is missing",
                  internal_code: "missing_parameters",
                },
              },
            },
          },
        },
      },
    },
  },
};

module.exports = {
  swaggerDocument,
};
