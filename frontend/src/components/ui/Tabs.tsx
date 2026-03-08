interface Tab<T extends string> {
  value: T
  label: string
}

interface TabsProps<T extends string> {
  tabs: Tab<T>[]
  active: T
  onChange: (value: T) => void
}

export function Tabs<T extends string>({ tabs, active, onChange }: TabsProps<T>) {
  return (
    <div className="flex gap-0 border-b border-border-100 mb-4">
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`
            relative px-4 py-2.5 text-xs font-medium transition-colors duration-150 cursor-pointer
            ${active === tab.value
              ? 'text-fg-100 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-fg-100'
              : 'text-fg-300 hover:text-fg-200'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
