describe("home responsive layout", () => {
  const viewports: Array<[number, number]> = [
    [375, 812],
    [834, 1112],
    [1440, 900],
  ];

  viewports.forEach(([width, height]) => {
    it(`keeps home readable at ${width}x${height}`, () => {
      cy.viewport(width, height);
      cy.visit("/");
      cy.contains("System Access").should("be.visible");
      cy.get('a[href*="/submit"]').first().then(($submit) => {
        const submitRect = $submit[0].getBoundingClientRect();
        cy.get('a[href*="/docs"]').first().then(($docs) => {
          const docsRect = $docs[0].getBoundingClientRect();
          if (width < 640) {
            expect(docsRect.top - submitRect.bottom).to.be.greaterThan(6);
          } else {
            expect(docsRect.left - submitRect.right).to.be.greaterThan(6);
          }
        });
      });
      cy.document().then((doc) => {
        const overflow = doc.documentElement.scrollWidth - doc.documentElement.clientWidth;
        expect(overflow).to.be.lessThan(2);
      });
    });
  });
});
