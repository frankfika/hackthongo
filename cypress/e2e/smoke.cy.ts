describe("smoke", () => {
  it("home renders sticky footer layout", () => {
    cy.viewport(1280, 800);
    cy.visit("/footer-test/short");
    cy.get("footer", { timeout: 15000 }).should("be.visible");
    cy.get("footer a").its("length").should("be.greaterThan", 1);
  });

  it("admin and judge routes are reachable without 404", () => {
    cy.visit("/admin");
    cy.location("pathname").should("match", /\/(en|zh)\/(admin\/dashboard|admin\/login)$/);

    cy.visit("/judge");
    cy.location("pathname").should("match", /\/(en|zh)\/(judge\/dashboard|judge\/login)$/);
  });
});
