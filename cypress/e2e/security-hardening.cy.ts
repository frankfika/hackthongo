describe("security hardening", () => {
  it("blocks forged origin on mutating api", () => {
    cy.request({
      url: "/api/projects",
      method: "POST",
      failOnStatusCode: false,
      headers: {
        origin: "https://evil.example",
      },
      body: {},
    }).its("status").should("eq", 403);
  });

  it("blocks cross-site fetch metadata on mutating api", () => {
    cy.request({
      url: "/api/projects",
      method: "POST",
      failOnStatusCode: false,
      headers: {
        "sec-fetch-site": "cross-site",
      },
      body: {},
    }).its("status").should("eq", 403);
  });

  it("rejects oversized mutating payload", () => {
    const hugeText = "a".repeat(1_050_000);
    cy.request({
      url: "/api/projects",
      method: "POST",
      failOnStatusCode: false,
      body: {
        registrationData: {
          email: "safe@example.com",
        },
        submissionData: {
          projectName: "payload-test",
          description: hugeText,
        },
      },
    }).its("status").should("eq", 413);
  });

  it("throttles auth endpoint requests", () => {
    const statuses: number[] = [];
    Cypress._.times(15, () => {
      cy.request({
        url: "/api/auth/session",
        method: "GET",
        failOnStatusCode: false,
      }).then((resp) => {
        statuses.push(resp.status);
      });
    });
    cy.then(() => {
      expect(statuses.some((status) => status === 429)).to.eq(true);
    });
  });
});
