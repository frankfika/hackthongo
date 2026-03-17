describe("responsive fixed footer", () => {
  const viewports: Array<[number, number]> = [
    [320, 740],
    [375, 812],
    [768, 900],
    [1024, 900],
    [1440, 1000],
    [1920, 1080]
  ];

  viewports.forEach(([width, height]) => {
    it(`short page keeps footer at bottom on ${width}px`, () => {
      cy.viewport(width, height);
      cy.visit("/footer-test/short");
      cy.get("footer").should("be.visible");
      cy.document().then((doc) => {
        const viewportHeight = doc.documentElement.clientHeight;
        const footerBottom = doc.querySelector("footer")!.getBoundingClientRect().bottom;
        expect(Math.abs(viewportHeight - footerBottom)).to.be.lessThan(16);
      });
    });

    it(`long page keeps footer fixed on ${width}px`, () => {
      cy.viewport(width, height);
      cy.visit("/footer-test/long");
      cy.get("footer").then(($footer) => {
        const beforeTop = $footer[0].getBoundingClientRect().top;
        cy.scrollTo("bottom");
        cy.get("footer").then(($footerAfter) => {
          const afterTop = $footerAfter[0].getBoundingClientRect().top;
          expect(Math.abs(afterTop - beforeTop)).to.be.lessThan(2);
        });
      });
    });
  });

  it("touch target is at least 44px", () => {
    cy.viewport(320, 740);
    cy.visit("/footer-test/short");
    cy.get("footer a").each(($el) => {
      const rect = $el[0].getBoundingClientRect();
      expect(rect.height).to.be.greaterThan(43);
    });
  });

  viewports.forEach(([width, height]) => {
    it(`footer links stay inside viewport on ${width}px`, () => {
      cy.viewport(width, height);
      cy.visit("/footer-test/short");
      cy.window().then((win) => {
        const viewportWidth = win.innerWidth;
        cy.get("footer a").each(($el) => {
          const rect = $el[0].getBoundingClientRect();
          expect(rect.left).to.be.greaterThan(-1);
          expect(rect.right).to.be.lessThan(viewportWidth + 1);
        });
      });
    });
  });

  it("home actions stay clickable when scrolling", () => {
    cy.viewport(375, 812);
    cy.visit("/");
    cy.scrollTo("bottom");
    cy.contains("a", "System Access").should("be.visible").click();
    cy.url().should("include", "/auth/signin");
  });
});
