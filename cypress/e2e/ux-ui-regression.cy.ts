describe("ux and ui regression", () => {
  it("main navigation routes users correctly", () => {
    cy.viewport(1024, 900);
    cy.visit("/");
    cy.contains("文档").click();
    cy.url().should("include", "/docs");
    cy.contains("排行榜").click();
    cy.url().should("include", "/leaderboard");
    cy.get('a[href*="/submit"]').first().click();
    cy.url().should("include", "/submit");
  });

  it("signin entry routes to role-specific login pages", () => {
    cy.viewport(768, 900);
    cy.visit("/auth/signin");
    cy.contains("管理员登录").click();
    cy.url().should("include", "/admin/login");
    cy.go("back");
    cy.contains("评委登录").click();
    cy.url().should("include", "/judge/login");
  });

  it("footer keeps readable stacked layout on small screens", () => {
    cy.viewport(320, 740);
    cy.visit("/footer-test/short");
    cy.get("footer > div > div").then(($row) => {
      const style = getComputedStyle($row[0]);
      expect(style.flexDirection).to.equal("column");
    });
    cy.get("footer p").should("be.visible");
    cy.get("footer a").should("have.length.at.least", 2);
  });

  it("footer switches to horizontal layout on desktop", () => {
    cy.viewport(1440, 1000);
    cy.visit("/footer-test/short");
    cy.get("footer > div > div").then(($row) => {
      const style = getComputedStyle($row[0]);
      expect(style.flexDirection).to.equal("row");
      expect(style.justifyContent).to.equal("space-between");
    });
  });

  it("admin and judge login pages hide global footer", () => {
    cy.viewport(1024, 900);
    cy.visit("/admin/login");
    cy.get("footer").should("not.exist");
    cy.visit("/judge/login");
    cy.get("footer").should("not.exist");
  });
});
