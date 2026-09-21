// Visually hidden field real visitors never see or fill; bots that auto-fill
// every input reveal themselves by giving it a value. The server actions
// silently drop any submission where "website" is non-empty.
export default function HoneypotField() {
  return (
    <div aria-hidden className="sr-only">
      <label>
        Website
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
