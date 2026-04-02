import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BiSearch } from "react-icons/bi";
import { X } from "lucide-react";
import axios from "axios";
import { restaurantBaseUrl, menuBaseUrl } from "../common/constant";
import { useAppData } from "../../context/AppContext";

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

      const [value, setValue] = useState(initialValue);
      const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
      const [showDropdown, setShowDropdown] = useState(false);
      const [loading, setLoading] = useState(false);

      useEffect(() => {
            setValue(initialValue);
      }, [initialValue]);

      useEffect(() => {
            if (!value.trim() || !location?.latitude) {
                  setSuggestions([]);
                  return;
            }

            const timer = setTimeout(async () => {
                  setLoading(true);
                  try {
                        const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
                        const params = { latitude: location.latitude, longitude: location.longitude, search: value, radius: 10000 };

                        const [resRes, foodRes] = await Promise.allSettled([
                              axios.get(`${restaurantBaseUrl}/all`, { params, headers }),
                              axios.get(`${menuBaseUrl}/search/food`, { params, headers })
                        ]);

                        const resSuggestions: Suggestion[] =
                              resRes.status === "fulfilled"
                                    ? (resRes.value.data.data || []).slice(0, 3).map((r: any) => ({
                                          id: r._id,
                                          name: r.name,
                                          image: r.image,
                                          type: "Restaurant" as const
                                    }))
                                    : [];

                        const foodSuggestions: Suggestion[] =
                              foodRes.status === "fulfilled"
                                    ? (foodRes.value.data.data || []).slice(0, 3).map((f: any) => ({
                                          id: f.item._id,
                                          name: f.item.name,
                                          image: f.item.imageUrl || "",
                                          type: "Dish" as const,
                                          restaurantId: f.restaurant._id
                                    }))
                                    : [];

                        setSuggestions([...resSuggestions, ...foodSuggestions]);
                  } finally {
                        setLoading(false);
                  }
            }, 300);

            return () => clearTimeout(timer);
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
            setValue(e.target.value);
            setShowDropdown(true);
            onSearch?.(e.target.value);
      };

      const handleClear = () => {
            setValue("");
            setSuggestions([]);
            onSearch?.("");
            inputRef.current?.focus();
      };

      const handleFocus = () => {
            if (redirectOnFocus) {
                  navigate("/search");
                  return;
            }
            setShowDropdown(true);
      };

      const handleSuggestionClick = (s: Suggestion) => {
            setShowDropdown(false);
            if (s.type === "Restaurant") {
                  navigate(`/restaurant/${s.id}`);
                  window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
                  navigate(`/search?search=${encodeURIComponent(s.name)}&type=food`);
            }
      };

      const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter" && value.trim()) {
                  setShowDropdown(false);
                  navigate(`/search?search=${encodeURIComponent(value)}&type=restaurant`);
                  onSearch?.(value);
            }
      };

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
                        />
                        {value ? (
                              <button onClick={handleClear} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <X size={18} />
                              </button>
                        ) : (
                              <BiSearch size={20} className="text-gray-400" />
                        )}
                  </div>

                  {showDropdown && (value.trim()) && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                              {loading ? (
                                    <div className="px-4 py-3 text-sm text-gray-400">Searching...</div>
                              ) : suggestions.length > 0 ? (
                                    suggestions.map((s) => (
                                          <button
                                                key={`${s.type}-${s.id}`}
                                                onMouseDown={() => handleSuggestionClick(s)}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                          >
                                                <img
                                                      src={s.image}
                                                      alt={s.name}
                                                      className="w-12 h-12 rounded-md object-cover shrink-0 bg-gray-100"
                                                      onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/48x48?text=?"; }}
                                                />
                                                <div>
                                                      <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                                                      <p className="text-xs text-gray-400">{s.type}</p>
                                                </div>
                                          </button>
                                    ))
                              ) : (
                                    <div className="px-4 py-3 text-sm text-gray-400">No results found</div>
                              )}
                        </div>
                  )}
            </div>
      );
};

export default SearchBar;
