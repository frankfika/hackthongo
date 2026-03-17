describe("responsive quick checks", () => {
  const viewports: Array<[number, number]> = [
    [320, 740],
    [375, 812],
    [1920, 1080]
  ];

  viewports.forEach(([width, height]) => {
    it(`footer and overflow sanity on ${width}px`, () => {
      cy.viewport(width, height);
      cy.visit("/footer-test/short");
      cy.get("footer").should("be.visible");
      cy.document().then((doc) => {
        const overflow = doc.documentElement.scrollWidth - doc.documentElement.clientWidth;
        expect(overflow).to.be.lessThan(2);
      });
      cy.window().then((win) => {
        const viewportWidth = win.innerWidth;
        cy.get("footer a").each(($el) => {
          const rect = $el[0].getBoundingClientRect();
          expect(rect.height).to.be.greaterThan(43);
          expect(rect.right).to.be.lessThan(viewportWidth + 1);
        });
      });
    });
  });
});
