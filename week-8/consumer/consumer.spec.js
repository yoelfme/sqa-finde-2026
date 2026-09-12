// Setting up our test framework
import { describe, expect, it } from "vitest";

// We need Pact in order to use it in our test
const { provider } = require("../pact"); // Mock Order API
const { Matchers } = require("@pact-foundation/pact");
const { eachLike } = Matchers;

// Importing our system under test (the orderClient) and our Order model
const { Order } = require("./order");
const { fetchOrders } = require("./orderClient"); // Order API Client

// This is where we start writing our test
describe("Pact with Order API", () => {
  describe("given there are orders", () => {
    const itemProperties = {
      name: "burger",
      quantity: 2,
      value: 100,
    };

    const orderProperties = {
      id: 1,
      items: eachLike(itemProperties),
    };

    describe("when a call to the API is made", () => {
      it("will receive the list of current orders", async () => {
        await provider // Mock Order API
          .addInteraction()
          .given("there are orders")
          .uponReceiving("a request for orders")
          .withRequest("GET", "/orders")
          .willRespondWith(200, (builder) => {
            builder.headers({ "Content-Type": "application/json; charset=utf-8" });
            // Mock the response body to match something like this:
            // [{ id: 1, items: [{ name: "burger", quantity: 2, value: 100 }] }]
            builder.jsonBody(eachLike(orderProperties)); 
          })
          .executeTest(async (mockserver) => {
            process.env.API_PORT = mockserver.port;
            await expect(fetchOrders()).resolves.toEqual([
              new Order(orderProperties.id, [itemProperties]),
            ]);
          });
      });
    });
  });
});
