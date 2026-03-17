describe("role auth and admin layout", () => {
  it("redirects unauthenticated users to dedicated logins", () => {
    cy.visit("/admin/dashboard");
    cy.location("pathname").should("match", /\/(en|zh)\/admin\/login$/);
    cy.visit("/judge/dashboard");
    cy.location("pathname").should("match", /\/(en|zh)\/judge\/login$/);
  });

  it("shows dedicated login portals", () => {
    cy.viewport(1280, 900);
    cy.visit("/admin/login");
    cy.contains("管理员登录").should("be.visible");
    cy.get("#email").should("have.value", "");

    cy.visit("/judge/login");
    cy.contains("评委登录").should("be.visible");
    cy.get("#email").should("have.value", "");
  });

  it("blocks unauthenticated admin and judge APIs", () => {
    cy.request({ url: "/api/admin/promote", method: "POST", failOnStatusCode: false, body: {} }).its("status").should("eq", 401);
    cy.request({ url: "/api/judge/assignments/batch-submit", method: "POST", failOnStatusCode: false, body: {} }).its("status").should("eq", 401);
  });
});
