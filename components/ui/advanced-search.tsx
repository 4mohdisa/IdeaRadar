"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface SearchSuggestion {
  type: "recent" | "popular" | "category"
  text: string
  icon?: string
}

interface AdvancedSearchProps {
  onSearch: (query: string) => void
  initialQuery?: string
  placeholder?: string
}

const POPULAR_SEARCHES = [
  "SaaS",
  "AI tools",
  "mobile app",
  "marketplace",
  "automation",
  "productivity",
  "fintech",
  "health tech",
]

const CATEGORIES = [
  { text: "AI & Machine Learning", icon: "🤖" },
  { text: "SaaS & Software", icon: "💻" },
  { text: "E-commerce", icon: "🛒" },
  { text: "Health & Fitness", icon: "💪" },
  { text: "Finance & Fintech", icon: "💰" },
  { text: "Education", icon: "📚" },
  { text: "Social & Community", icon: "👥" },
  { text: "Productivity", icon: "⚡" },
]

export function AdvancedSearch({ 
  onSearch, 
  initialQuery = "", 
  placeholder = "Search ideas by keyword, category, or topic..." 
}: AdvancedSearchProps) {
  const [query, setQuery] = useState(initialQuery)
  const [isFocused, setIsFocused] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recentSearches")
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored).slice(0, 5))
      } catch (e) {
        setRecentSearches([])
      }
    }
  }, [])

  // Save search to recent
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return
    
    const updated = [
      searchQuery,
      ...recentSearches.filter(s => s.toLowerCase() !== searchQuery.toLowerCase())
    ].slice(0, 5)
    
    setRecentSearches(updated)
    localStorage.setItem("recentSearches", JSON.stringify(updated))
  }, [recentSearches])

  // Generate suggestions based on query
  useEffect(() => {
    if (!query.trim()) {
      // Show recent searches and categories when empty
      const newSuggestions: SearchSuggestion[] = [
        ...recentSearches.map(text => ({ type: "recent" as const, text })),
        ...CATEGORIES.slice(0, 4).map(cat => ({ 
          type: "category" as const, 
          text: cat.text, 
          icon: cat.icon 
        })),
      ]
      setSuggestions(newSuggestions)
      return
    }

    // Debounce suggestions
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      const queryLower = query.toLowerCase()
      const newSuggestions: SearchSuggestion[] = []

      // Match categories
      CATEGORIES.forEach(cat => {
        if (cat.text.toLowerCase().includes(queryLower)) {
          newSuggestions.push({ type: "category", text: cat.text, icon: cat.icon })
        }
      })

      // Match popular searches
      POPULAR_SEARCHES.forEach(search => {
        if (search.toLowerCase().includes(queryLower) && 
            !newSuggestions.some(s => s.text.toLowerCase() === search.toLowerCase())) {
          newSuggestions.push({ type: "popular", text: search })
        }
      })

      // Match recent searches
      recentSearches.forEach(search => {
        if (search.toLowerCase().includes(queryLower) &&
            !newSuggestions.some(s => s.text.toLowerCase() === search.toLowerCase())) {
          newSuggestions.push({ type: "recent", text: search })
        }
      })

      setSuggestions(newSuggestions.slice(0, 8))
    }, 150)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, recentSearches])

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isFocused || suggestions.length === 0) {
      if (e.key === "Enter") {
        handleSearch(query)
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSearch(suggestions[selectedIndex].text)
        } else {
          handleSearch(query)
        }
        break
      case "Escape":
        setIsFocused(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim()
    if (trimmed) {
      saveRecentSearch(trimmed)
    }
    setQuery(trimmed)
    setIsFocused(false)
    setSelectedIndex(-1)
    onSearch(trimmed)
  }

  const clearSearch = () => {
    setQuery("")
    onSearch("")
    inputRef.current?.focus()
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem("recentSearches")
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSelectedIndex(-1)
          }}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-surface px-4 py-3 pl-10 pr-10 text-sm text-text-main placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        
        {/* Search Icon */}
        <svg
          className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        {/* Clear Button */}
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-main"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isFocused && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
          {/* Recent searches header */}
          {!query && recentSearches.length > 0 && (
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <span className="text-xs font-medium text-text-muted">Recent Searches</span>
              <button
                onClick={clearRecentSearches}
                className="text-xs text-text-muted transition-colors hover:text-accent"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Suggestions list */}
          <ul className="max-h-80 overflow-y-auto py-2">
            {suggestions.map((suggestion, index) => (
              <li key={`${suggestion.type}-${suggestion.text}`}>
                <button
                  onClick={() => handleSearch(suggestion.text)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                    selectedIndex === index
                      ? "bg-accent/10 text-accent"
                      : "text-text-main hover:bg-surface-hover"
                  }`}
                >
                  {/* Icon based on type */}
                  {suggestion.type === "recent" && (
                    <svg className="h-4 w-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {suggestion.type === "popular" && (
                    <svg className="h-4 w-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  )}
                  {suggestion.type === "category" && (
                    <span className="text-base">{suggestion.icon}</span>
                  )}

                  {/* Text with highlight */}
                  <span className="flex-1">
                    {query ? (
                      <HighlightMatch text={suggestion.text} query={query} />
                    ) : (
                      suggestion.text
                    )}
                  </span>

                  {/* Type badge */}
                  <span className="text-xs text-text-muted">
                    {suggestion.type === "recent" && "Recent"}
                    {suggestion.type === "popular" && "Popular"}
                    {suggestion.type === "category" && "Category"}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {/* Search tip */}
          <div className="border-t border-border px-4 py-2">
            <p className="text-xs text-text-muted">
              Press <kbd className="rounded bg-border px-1.5 py-0.5 font-mono text-xs">Enter</kbd> to search
              or <kbd className="rounded bg-border px-1.5 py-0.5 font-mono text-xs">↑↓</kbd> to navigate
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper component to highlight matching text
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>

  const parts = text.split(new RegExp(`(${query})`, "gi"))

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-accent/20 text-accent">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}
