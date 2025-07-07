export function GridBackgroundStyles() {
  return (
    <style jsx global>{`
      .bg-grid-pattern {
        background-image:
          linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px);
        background-size: 24px 24px;
      }
      .bg-grid-pattern-subtle {
        background-image:
          linear-gradient(rgba(99, 102, 241, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99, 102, 241, 0.05) 1px, transparent 1px);
        background-size: 20px 20px;
      }
      .bg-grid-pattern-hero {
        background-image:
          linear-gradient(rgba(99, 102, 241, 0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99, 102, 241, 0.08) 1px, transparent 1px);
        background-size: 32px 32px;
      }
    `}</style>
  );
}
