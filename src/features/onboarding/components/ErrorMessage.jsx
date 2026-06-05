export default function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 mt-2 text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
      </svg>
      <span className="text-xs font-medium">{message}</span>
    </div>
  );
}