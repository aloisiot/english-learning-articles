export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <main className="page page-narrow">
      <h1>What is kept about you</h1>

      <h2>Your account</h2>
      <p>
        An email address, a display name and a timezone. Nothing else — no
        age, no country, no photograph, no payment details. The email address
        is used to sign you in, and for nothing else.
      </p>

      <h2>Your classes</h2>
      <p>
        A record of each class is kept: who taught, who attended, when it was
        scheduled, when it actually started and ended, and how it finished.
        This record is the point of the platform, and it is kept after the
        class in the way an invoice would be.
      </p>

      <h2>What is not kept</h2>
      <p>
        Video and audio are never recorded. Chat messages during a class are
        not stored anywhere — they travel between the browsers in the call
        and are gone when it ends.
      </p>

      <h2>Removing your account</h2>
      <p>
        Ask, and your sign-in is deleted. The record of classes that happened
        remains, without a way to sign in to it, for the same reason a
        receipt outlives an account.
      </p>
    </main>
  );
}
