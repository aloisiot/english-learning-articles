// There is nothing at the root of the class app on purpose: a class is
// reached through its own signed link, and the admin page lives behind
// an unguessable path. Anyone arriving here has no business being sent
// anywhere in particular.
export default function ClassHome() {
  return (
    <main className="notice">
      <h1>Class</h1>
      <p className="muted">
        Classes are joined through the link you were sent.
      </p>
    </main>
  );
}
