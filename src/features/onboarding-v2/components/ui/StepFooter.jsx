/**
 * Card footer with the step's actions. On phones it sticks to the bottom
 * of the screen and stacks buttons full-width (primary on top); from sm
 * up it's a single row inside the card. `start` sits on the left — above
 * the buttons on phones, or below them with `startLastOnMobile` (for a
 * secondary action like "Change details").
 * @param {{
 *   start?: import('react').ReactNode,
 *   startLastOnMobile?: boolean,
 *   children: import('react').ReactNode,
 * }} props
 */
export default function StepFooter({ start, startLastOnMobile = false, children }) {
  return (
    <footer className="sticky bottom-0 z-10 flex flex-col gap-3 rounded-b-2xl border-t border-gray-200 bg-gray-50/95 px-5 py-4 backdrop-blur sm:static sm:flex-row sm:items-center sm:gap-4 sm:rounded-b-[20px] sm:bg-gray-50/60 sm:px-8 sm:py-[18px] dark:border-gray-800 dark:bg-gray-900/95">
      {start && (
        <div className={`min-w-0 sm:flex-1 ${startLastOnMobile ? "order-last *:w-full sm:order-none sm:*:w-auto" : ""}`}>{start}</div>
      )}
      <div className="flex flex-col-reverse gap-2.5 *:w-full sm:ml-auto sm:flex-row sm:items-center sm:*:w-auto">
        {children}
      </div>
    </footer>
  );
}
