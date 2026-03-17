describe("overflow guard", () => {
  const viewports: Array<[number, number]> = [
    [320, 740],
    [375, 812],
    [768, 900],
    [1024, 900],
    [1440, 1000],
    [1920, 1080]
  ];

  const pages = [
    "/",
    "/docs",
    "/leaderboard",
    "/submit",
    "/submit/success",
    "/privacy",
    "/auth/signin",
    "/admin/login",
    "/judge/login",
    "/footer-test/short",
    "/footer-test/long",
    "/ui-test/overlays"
  ];

  viewports.forEach(([width, height]) => {
    pages.forEach((path) => {
      it(`no horizontal overflow on ${path} at ${width}px`, () => {
        cy.viewport(width, height);
        cy.visit(path);
        cy.document().then((doc) => {
          const overflow = doc.documentElement.scrollWidth - doc.documentElement.clientWidth;
          expect(overflow).to.be.lessThan(2);
        });
      });
    });
  });

  it("modal size stays within viewport rules", () => {
    cy.viewport(320, 740);
    cy.visit("/ui-test/overlays");
    cy.contains("打开弹窗").click();
    cy.window().then((win) => {
      const viewportWidth = win.innerWidth;
      const viewportHeight = win.innerHeight;
      cy.get(".app-overlay-panel").then(($panel) => {
        const rect = $panel[0].getBoundingClientRect();
        expect(rect.width).to.be.lessThan(viewportWidth * 0.91);
        expect(rect.height).to.be.lessThan(viewportHeight * 0.86);
      });
    });
  });

  it("toast stays inside viewport", () => {
    cy.viewport(320, 740);
    cy.visit("/ui-test/overlays");
    cy.contains("触发 Toast").click();
    cy.wait(800);
    cy.window().then((win) => {
      const viewportWidth = win.innerWidth;
      const viewportHeight = win.innerHeight;
      cy.get("[data-sonner-toast]").first().then(($toast) => {
        const rect = $toast[0].getBoundingClientRect();
        expect(rect.left).to.be.greaterThan(-1);
        expect(rect.right).to.be.lessThan(viewportWidth + 1);
        expect(rect.top).to.be.greaterThan(-1);
        expect(rect.bottom).to.be.lessThan(viewportHeight + 1);
      });
    });
  });

});
