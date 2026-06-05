// ── Green/gray validation rule list (shown below input) ──────────────────────
export default function ValidationChecklist({ rules, value, extraValue }) {
  return (
    <ul className="mt-2 space-y-1">
      {rules.map((rule, i) => {
        const passed = value ? rule.test(value, extraValue) : false;
        return (
          <li key={i} className={`flex items-center gap-1.5 text-xs ${passed ? "text-emerald-500" : "text-gray-400"}`}>
            {passed
              ? <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd"/></svg>
              : <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" clipRule="evenodd"/></svg>
            }
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}