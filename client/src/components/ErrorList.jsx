// Shows a list of error messages (from the API or from form checks).
export default function ErrorList({ errors }) {
  if (!errors || errors.length === 0) return null;
  return (
    <ul className="errors" role="alert">
      {errors.map((msg) => (
        <li key={msg}>{msg}</li>
      ))}
    </ul>
  );
}
