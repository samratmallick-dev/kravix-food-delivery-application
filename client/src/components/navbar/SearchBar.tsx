import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BiSearch } from "react-icons/bi";
import { X } from "lucide-react";
import { useAppData } from "../../context/AppContext";
import { detectSearchType } from "../../utils/searchIntent";
import { autocompleteMenu } from "../../utils/menu.api";

interface Suggestion {
      id: string;
      name: string;
      image: string;
      type: "Restaurant" | "Dish";
      restaurantId?: string;
}

interface SearchBarProps {
      initialValue?: string;
      onSearch?: (value: string) => void;
      redirectOnFocus?: boolean;
      autoFocus?: boolean;
      locationPrefix?: React.ReactNode;
}

const SearchBar = ({ initialValue = "", onSearch, redirectOnFocus = false, autoFocus = false, locationPrefix }: SearchBarProps) => {
      const { location } = useAppData();
      const navigate = useNavigate();
      const inputRef = useRef<HTMLInputElement>(null);
      const containerRef = useRef<HTMLDivElement>(null);
      const abortRef = useRef<AbortController | null>(null);
      const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

      const [value, setValue] = useState(initialValue);
      const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
      const [showDropdown, setShowDropdown] = useState(false);
      const [loading, setLoading] = useState(false);
      const [activeIndex, setActiveIndex] = useState(-1);

      useEffect(() => { setValue(initialValue); }, [initialValue]);

      useEffect(() => {
            if (!value.trim() || !location?.latitude) {
                  setSuggestions([]);
                  setLoading(false);
                  return;
            }

            abortRef.current?.abort();
            abortRef.current = new AbortController();
            const controller = abortRef.current;

            setLoading(true);

            const timer = setTimeout(async () => {
                  try {
                        const data = await autocompleteMenu(
                              {
                                    q: value,
                                    latitude: location.latitude,
                                    longitude: location.longitude,
                                    radius: 10000,
                              },
                              { signal: controller.signal }
                        );
                        setSuggestions(data.data || []);
                        setActiveIndex(-1);
                  } catch (err: any) {
                        if (err.name === "AbortError" || err.message?.includes("aborted")) return;
                        setSuggestions([]);
                  } finally {
                        setLoading(false);
                  }
            }, 200);

            return () => {
                  clearTimeout(timer);
                  controller.abort();
            };
      }, [value, location]);

      useEffect(() => {
            const handleClickOutside = (e: MouseEvent) => {
                  if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                        setShowDropdown(false);
                  }
            };
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
      }, []);

      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            setValue(val);
            setShowDropdown(true);
            if (!val) { onSearch?.(""); return; }
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => { onSearch?.(val); }, 400);
      };

      const handleClear = () => {
            setValue("");
            setSuggestions([]);
            onSearch?.("");
            inputRef.current?.focus();
      };

      const handleFocus = () => {
            if (redirectOnFocus) { navigate("/search"); return; }
            setShowDropdown(true);
      };

      const commitSuggestion = (s: Suggestion) => {
            setShowDropdown(false);
            if (s.type === "Restaurant") {
                  navigate(`/restaurant/${s.id}`);
                  window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
                  navigate(`/search?search=${encodeURIComponent(s.name)}&type=food`);
            }
      };

      const allSuggestions = [
            ...suggestions.filter((s) => s.type === "Restaurant"),
            ...suggestions.filter((s) => s.type === "Dish"),
      ];

      const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (showDropdown && allSuggestions.length > 0) {
                  if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setActiveIndex((i) => Math.min(i + 1, allSuggestions.length - 1));
                        return;
                  }
                  if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setActiveIndex((i) => Math.max(i - 1, -1));
                        return;
                  }
                  if (e.key === "Enter" && activeIndex >= 0) {
                        e.preventDefault();
                        commitSuggestion(allSuggestions[activeIndex]!);
                        return;
                  }
                  if (e.key === "Escape") { setShowDropdown(false); return; }
            }
            if (e.key === "Enter" && value.trim()) {
                  setShowDropdown(false);
                  if (onSearch) {
                        onSearch(value);
                  } else {
                        const type = detectSearchType(value);
                        navigate(`/search?search=${encodeURIComponent(value)}&type=${type}`);
                  }
            }
      };

      const highlightMatch = (text: string, query: string) => {
            if (!query.trim()) return <span>{text}</span>;
            const idx = text.toLowerCase().indexOf(query.toLowerCase());
            if (idx === -1) return <span>{text}</span>;
            return (
                  <span>
                        {text.slice(0, idx)}
                        <span className="text-primary font-bold">{text.slice(idx, idx + query.length)}</span>
                        {text.slice(idx + query.length)}
                  </span>
            );
      };

      const restaurantSuggestions = allSuggestions.filter((s) => s.type === "Restaurant");
      const dishSuggestions = allSuggestions.filter((s) => s.type === "Dish");

      return (
            <div ref={containerRef} className="relative w-full">
                  <div className="flex items-center border border-gray-300 rounded-lg bg-white px-4 py-2 gap-3 shadow-sm">
                        {locationPrefix}
                        <input
                              ref={inputRef}
                              autoFocus={autoFocus}
                              value={value}
                              onChange={handleChange}
                              onFocus={handleFocus}
                              onKeyDown={handleKeyDown}
                              placeholder="Search for restaurants and food"
                              className="flex-1 min-w-0 outline-none text-gray-700 text-sm bg-transparent placeholder-gray-400"
                              autoComplete="off"
                        />
                        {value ? (
                              <button onClick={handleClear} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <X size={18} />
                              </button>
                        ) : (
                              <BiSearch size={20} className="text-gray-400" />
                        )}
                  </div>

                  {showDropdown && value.trim() && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                              {loading ? (
                                    <div className="px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
                                          <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                                          Searching...
                                    </div>
                              ) : allSuggestions.length > 0 ? (
                                    <>
                                          {restaurantSuggestions.length > 0 && (
                                                <>
                                                      <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Restaurants</p>
                                                      {restaurantSuggestions.map((s, i) => (
                                                            <button
                                                                  key={`R-${s.id}`}
                                                                  onMouseDown={() => commitSuggestion(s)}
                                                                  onMouseEnter={() => setActiveIndex(i)}
                                                                  className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${activeIndex === i ? "bg-gray-100" : "hover:bg-gray-50"}`}
                                                            >
                                                                  <img
                                                                        src={s.image}
                                                                        alt={s.name}
                                                                        className="w-10 h-10 rounded-md object-cover shrink-0 bg-gray-100"
                                                                        onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/40x40?text=?"; }}
                                                                  />
                                                                  <div className="min-w-0">
                                                                        <p className="text-sm font-medium text-gray-800 truncate">{highlightMatch(s.name, value)}</p>
                                                                        <p className="text-xs text-gray-400">Restaurant</p>
                                                                  </div>
                                                            </button>
                                                      ))}
                                                </>
                                          )}
                                          {dishSuggestions.length > 0 && (
                                                <>
                                                      <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Dishes</p>
                                                      {dishSuggestions.map((s, i) => {
                                                            const idx = restaurantSuggestions.length + i;
                                                            return (
                                                                  <button
                                                                        key={`D-${s.id}`}
                                                                        onMouseDown={() => commitSuggestion(s)}
                                                                        onMouseEnter={() => setActiveIndex(idx)}
                                                                        className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${activeIndex === idx ? "bg-gray-100" : "hover:bg-gray-50"}`}
                                                                  >
                                                                        <img
                                                                              src={s.image}
                                                                              alt={s.name}
                                                                              className="w-10 h-10 rounded-md object-cover shrink-0 bg-gray-100"
                                                                              onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/40x40?text=?"; }}
                                                                        />
                                                                        <div className="min-w-0">
                                                                              <p className="text-sm font-medium text-gray-800 truncate">{highlightMatch(s.name, value)}</p>
                                                                              <p className="text-xs text-gray-400">Dish</p>
                                                                        </div>
                                                                  </button>
                                                            );
                                                      })}
                                                </>
                                          )}
                                          <div className="px-4 py-2 border-t border-gray-100">
                                                <button
                                                      onMouseDown={() => {
                                                            setShowDropdown(false);
                                                            if (onSearch) {
                                                                  onSearch(value);
                                                            } else {
                                                                  const type = detectSearchType(value);
                                                                  navigate(`/search?search=${encodeURIComponent(value)}&type=${type}`);
                                                            }
                                                      }}
                                                      className="text-xs text-primary hover:underline"
                                                >
                                                      See all results for &ldquo;{value}&rdquo;
                                                </button>
                                          </div>
                                    </>
                              ) : (
                                    <div className="px-4 py-3 text-sm text-gray-400">No results found for &ldquo;{value}&rdquo;</div>
                              )}
                        </div>
                  )}
            </div>
      );
};

export default SearchBar;