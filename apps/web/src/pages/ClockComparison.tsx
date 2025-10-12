import { useState, useEffect, useRef } from 'react';
import { useAptos } from '../contexts/AptosContext';
import styles from './ClockComparison.module.css';

interface TimezoneData {
  id: string;
  name: string;
  offset: number; // offset in minutes
}

interface ClockState {
  wallTime: number;
  aptosTime: number;
  lastFetchTime: number;
  timeDiff: number;
  latencyMs: number;
  latencyCorrection: number;
}

const STORAGE_KEYS = {
  TIMEZONES: 'aptos-clock-timezones',
  IS_SMOOTH: 'aptos-clock-smooth',
  IS_ANALOG: 'aptos-clock-analog',
  POLL_INTERVAL: 'aptos-clock-poll-interval',
  ACCOUNT_FOR_LATENCY: 'aptos-clock-account-latency',
  SHOW_PRECISE_SECONDS: 'aptos-clock-precise-seconds',
  IS_24_HOUR: 'aptos-clock-24-hour',
};

// Detect if user's locale prefers 24-hour time format
const detectLocale24HourPreference = (): boolean => {
  try {
    const testDate = new Date(2000, 0, 1, 23, 0, 0);
    const formatted = testDate.toLocaleTimeString();
    // If the formatted time contains '23', it's 24-hour format
    // If it contains '11', it's 12-hour format
    const is24Hour = formatted.includes('23');
    return is24Hour;
  } catch {
    // Default to 12-hour if detection fails
    return false;
  }
};

function ClockComparison() {
  const { aptos } = useAptos();

  // Load from localStorage with fallbacks
  const [timezones, setTimezones] = useState<TimezoneData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TIMEZONES);
      return saved ? JSON.parse(saved) : [{ id: '1', name: 'UTC', offset: 0 }];
    } catch {
      return [{ id: '1', name: 'UTC', offset: 0 }];
    }
  });

  const [clockStates, setClockStates] = useState<Map<string, ClockState>>(new Map());

  const [isSmooth, setIsSmooth] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.IS_SMOOTH);
    return saved !== null ? saved === 'true' : true;
  });

  const [isAnalog, setIsAnalog] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.IS_ANALOG);
    return saved !== null ? saved === 'true' : false;
  });

  const [pollInterval, setPollInterval] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.POLL_INTERVAL);
    return saved !== null ? parseInt(saved) : 2500;
  });

  const [accountForLatency, setAccountForLatency] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNT_FOR_LATENCY);
    return saved !== null ? saved === 'true' : true;
  });

  const [showPreciseSeconds, setShowPreciseSeconds] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHOW_PRECISE_SECONDS);
    return saved !== null ? saved === 'true' : false;
  });

  const [is24Hour, setIs24Hour] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.IS_24_HOUR);
    if (saved !== null) {
      return saved === 'true';
    }
    // Detect user's locale preference, default to 12-hour if uncertain
    return detectLocale24HourPreference();
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animationRef = useRef<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Persist timezones to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TIMEZONES, JSON.stringify(timezones));
    } catch (error) {
      console.error('Failed to save timezones:', error);
    }
  }, [timezones]);

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IS_SMOOTH, String(isSmooth));
  }, [isSmooth]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IS_ANALOG, String(isAnalog));
  }, [isAnalog]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.POLL_INTERVAL, String(pollInterval));
  }, [pollInterval]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACCOUNT_FOR_LATENCY, String(accountForLatency));
  }, [accountForLatency]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHOW_PRECISE_SECONDS, String(showPreciseSeconds));
  }, [showPreciseSeconds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IS_24_HOUR, String(is24Hour));
  }, [is24Hour]);

  // Common timezones and cities for autocomplete
  const allTimezones = [
    // Popular timezones
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'America/Denver',
    'America/Toronto',
    'America/Vancouver',
    'America/Mexico_City',
    'America/Sao_Paulo',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Rome',
    'Europe/Madrid',
    'Europe/Amsterdam',
    'Europe/Brussels',
    'Europe/Vienna',
    'Europe/Prague',
    'Europe/Warsaw',
    'Europe/Stockholm',
    'Europe/Moscow',
    'Europe/Istanbul',
    'Asia/Tokyo',
    'Asia/Seoul',
    'Asia/Shanghai',
    'Asia/Beijing',
    'Asia/Hong_Kong',
    'Asia/Singapore',
    'Asia/Bangkok',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Mumbai',
    'Asia/Karachi',
    'Asia/Jakarta',
    'Asia/Manila',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Australia/Brisbane',
    'Australia/Perth',
    'Pacific/Auckland',
    'Pacific/Fiji',
    'Pacific/Honolulu',
    'Africa/Cairo',
    'Africa/Johannesburg',
    'Africa/Lagos',
    'Africa/Nairobi',
    // Common city names
    'New York',
    'Los Angeles',
    'Chicago',
    'London',
    'Paris',
    'Tokyo',
    'Sydney',
    'Hong Kong',
    'Singapore',
    'Dubai',
    'Berlin',
    'Moscow',
    'Beijing',
    'Mumbai',
    'Toronto',
    'Seoul',
    'Bangkok',
    'Istanbul',
    'Shanghai',
    'Mexico City',
    // UTC offsets examples
    'UTC+0',
    'UTC+1',
    'UTC+2',
    'UTC+3',
    'UTC+4',
    'UTC+5',
    'UTC+5:30',
    'UTC+6',
    'UTC+7',
    'UTC+8',
    'UTC+9',
    'UTC+10',
    'UTC+11',
    'UTC+12',
    'UTC-1',
    'UTC-2',
    'UTC-3',
    'UTC-4',
    'UTC-5',
    'UTC-6',
    'UTC-7',
    'UTC-8',
    'UTC-9',
    'UTC-10',
    'UTC-11',
    'UTC-12',
  ];

  // Fetch Aptos blockchain time
  const fetchAptosTime = async (): Promise<{ timestamp: number; latency: number }> => {
    const startTime = performance.now();
    try {
      const resource = await aptos.getAccountResource({
        accountAddress: '0x1',
        resourceType: '0x1::timestamp::CurrentTimeMicroseconds',
      });

      const endTime = performance.now();
      const latency = endTime - startTime;

      const microseconds = BigInt((resource as { microseconds: string }).microseconds);
      const timestamp = Number(microseconds) / 1000; // Convert to milliseconds

      return { timestamp, latency };
    } catch (error) {
      console.error('Error fetching Aptos time:', error);
      throw error;
    }
  };

  // Update clock states
  const updateClockStates = async () => {
    setIsFetching(true);
    try {
      const { timestamp: aptosTime, latency } = await fetchAptosTime();
      const now = Date.now();

      // Calculate latency correction (half of round trip time)
      const latencyCorrection = accountForLatency ? latency / 2 : 0;
      const correctedAptosTime = aptosTime + latencyCorrection;

      setClockStates((prev) => {
        const newStates = new Map(prev);
        timezones.forEach((tz) => {
          newStates.set(tz.id, {
            wallTime: now,
            aptosTime: correctedAptosTime,
            lastFetchTime: now,
            timeDiff: correctedAptosTime - now,
            latencyMs: latency,
            latencyCorrection,
          });
        });
        return newStates;
      });
    } catch (error) {
      console.error('Failed to update clock states:', error);
    } finally {
      setIsFetching(false);
    }
  };

  // Animation loop - wall clock always smooth, Aptos clock only smooth if enabled
  useEffect(() => {
    const animate = () => {
      const now = Date.now();
      setClockStates((prev) => {
        const newStates = new Map(prev);
        timezones.forEach((tz) => {
          const state = prev.get(tz.id);
          if (state) {
            // Wall clock always updates smoothly
            // Aptos clock only updates smoothly if isSmooth is enabled
            const elapsed = now - state.lastFetchTime;
            newStates.set(tz.id, {
              ...state,
              wallTime: now,
              aptosTime: isSmooth ? state.aptosTime + elapsed : state.aptosTime,
              lastFetchTime: now,
            });
          }
        });
        return newStates;
      });
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isSmooth, timezones]);

  // Polling interval for blockchain time
  useEffect(() => {
    updateClockStates();

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(updateClockStates, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pollInterval, timezones, accountForLatency]);

  // Parse timezone search query
  const parseTimezoneQuery = (query: string): TimezoneData | null => {
    const trimmed = query.trim();
    if (!trimmed) return null;

    // Try parsing as UTC offset (e.g., "UTC+5", "+5", "-3:30")
    const utcMatch = trimmed.match(/^(?:UTC)?([+-])(\d{1,2})(?::(\d{2}))?$/i);
    if (utcMatch) {
      const sign = utcMatch[1] === '+' ? 1 : -1;
      const hours = parseInt(utcMatch[2]);
      const minutes = utcMatch[3] ? parseInt(utcMatch[3]) : 0;
      const offset = sign * (hours * 60 + minutes);
      const name = `UTC${utcMatch[1]}${hours}${minutes ? ':' + minutes : ''}`;
      return { id: Date.now().toString(), name, offset };
    }

    // Try as timezone name (e.g., "America/New_York")
    try {
      // Test if it's a valid timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: trimmed,
        timeZoneName: 'short',
      });
      formatter.format(new Date());

      // Calculate offset
      const now = new Date();
      const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
      const tzDate = new Date(now.toLocaleString('en-US', { timeZone: trimmed }));
      const offset = (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);

      return { id: Date.now().toString(), name: trimmed, offset };
    } catch {
      // Not a valid timezone, try as city name common mappings
      const cityMappings: Record<string, string> = {
        'new york': 'America/New_York',
        'los angeles': 'America/Los_Angeles',
        chicago: 'America/Chicago',
        london: 'Europe/London',
        paris: 'Europe/Paris',
        tokyo: 'Asia/Tokyo',
        sydney: 'Australia/Sydney',
        'hong kong': 'Asia/Hong_Kong',
        singapore: 'Asia/Singapore',
        dubai: 'Asia/Dubai',
        berlin: 'Europe/Berlin',
        moscow: 'Europe/Moscow',
        beijing: 'Asia/Shanghai',
        mumbai: 'Asia/Kolkata',
        toronto: 'America/Toronto',
      };

      const lowerQuery = trimmed.toLowerCase();
      const mappedTz = cityMappings[lowerQuery];
      if (mappedTz) {
        return parseTimezoneQuery(mappedTz);
      }
    }

    return null;
  };

  // Generate suggestions based on search query
  const generateSuggestions = (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const matches = allTimezones.filter((tz) => tz.toLowerCase().includes(lowerQuery));

    // Sort by relevance (starts with query first, then contains)
    matches.sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      const aStarts = aLower.startsWith(lowerQuery);
      const bStarts = bLower.startsWith(lowerQuery);

      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.localeCompare(b);
    });

    setSuggestions(matches.slice(0, 10)); // Limit to 10 suggestions
  };

  // Debounced search handler
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(true);

    // Clear previous debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new debounce timer
    debounceRef.current = setTimeout(() => {
      generateSuggestions(value);
    }, 300);
  };

  const selectSuggestion = (suggestion: string) => {
    const tzData = parseTimezoneQuery(suggestion);
    if (tzData) {
      // Check if already exists
      if (!timezones.some((tz) => tz.name === tzData.name)) {
        setTimezones([...timezones, tzData]);
      }
    }
    // Clear input and close suggestions
    setSearchQuery('');
    setShowSuggestions(false);
    setSuggestions([]);
    // Focus back on input for easy adding of another timezone
    inputRef.current?.focus();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const removeTimezone = (id: string) => {
    setTimezones(timezones.filter((tz) => tz.id !== id));
    setClockStates((prev) => {
      const newStates = new Map(prev);
      newStates.delete(id);
      return newStates;
    });
  };

  const formatTime = (timestamp: number, offset: number, isAnalog: boolean) => {
    const date = new Date(timestamp + offset * 60 * 1000);
    if (isAnalog) {
      const milliseconds = date.getUTCMilliseconds();
      return {
        hours: date.getUTCHours(),
        minutes: date.getUTCMinutes(),
        seconds: date.getUTCSeconds(),
        milliseconds,
      };
    }

    const hours24 = date.getUTCHours();
    const hours12 = hours24 % 12 || 12;
    const ampm = hours24 >= 12 ? 'PM' : 'AM';
    const displayHours = is24Hour ? hours24 : hours12;

    if (showPreciseSeconds) {
      const hoursStr = displayHours.toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      const seconds = date.getUTCSeconds().toString().padStart(2, '0');
      const centiseconds = Math.floor(date.getUTCMilliseconds() / 10)
        .toString()
        .padStart(2, '0');
      const timeStr = `${hoursStr}:${minutes}:${seconds}.${centiseconds}`;
      return is24Hour ? timeStr : `${timeStr} ${ampm}`;
    }

    const hoursStr = displayHours.toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');
    const timeStr = `${hoursStr}:${minutes}:${seconds}`;
    return is24Hour ? timeStr : `${timeStr} ${ampm}`;
  };

  // Get color based on time difference
  const getDriftColor = (diffMs: number): string => {
    const absDiff = Math.abs(diffMs);
    if (absDiff < 1000) return '#4fc3a0'; // Green: < 1s
    if (absDiff < 5000) return '#f59e0b'; // Yellow: 1-5s
    return '#ef4444'; // Red: > 5s
  };

  const AnalogClock = ({
    hours,
    minutes,
    seconds,
    milliseconds,
  }: {
    hours: number;
    minutes: number;
    seconds: number;
    milliseconds: number;
  }) => {
    // Convert to 12-hour for analog display if needed
    const displayHours = is24Hour ? hours % 12 : hours % 12;

    // Add smooth sub-second movement to analog clock
    const secondAngle = seconds * 6 + milliseconds * 0.006 - 90; // 6 degrees per second + milliseconds
    const minuteAngle = minutes * 6 + seconds * 0.1 + milliseconds * 0.0001 - 90; // 6 degrees per minute
    const hourAngle = displayHours * 30 + minutes * 0.5 - 90; // 30 degrees per hour

    return (
      <svg className={styles.analogClock} viewBox="0 0 200 200">
        {/* Clock face */}
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="rgba(0, 0, 0, 0.3)"
          stroke="rgba(79, 195, 160, 0.3)"
          strokeWidth="2"
        />

        {/* Hour markers */}
        {[...Array(12)].map((_, i) => {
          const angle = i * 30 * (Math.PI / 180);
          const x1 = 100 + Math.cos(angle) * 75;
          const y1 = 100 + Math.sin(angle) * 75;
          const x2 = 100 + Math.cos(angle) * 85;
          const y2 = 100 + Math.sin(angle) * 85;
          const isMainHour = i % 3 === 0;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(79, 195, 160, 0.5)"
              strokeWidth={isMainHour ? '3' : '2'}
            />
          );
        })}

        {/* Hour numbers */}
        {[12, 3, 6, 9].map((num) => {
          const angle = (num === 12 ? 0 : num * 30) * (Math.PI / 180) - Math.PI / 2;
          const x = 100 + Math.cos(angle) * 65;
          const y = 100 + Math.sin(angle) * 65;
          return (
            <text
              key={num}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#4fc3a0"
              fontSize="18"
              fontWeight="600"
            >
              {num}
            </text>
          );
        })}

        {/* Hour hand */}
        <line
          x1="100"
          y1="100"
          x2={100 + Math.cos((hourAngle * Math.PI) / 180) * 50}
          y2={100 + Math.sin((hourAngle * Math.PI) / 180) * 50}
          stroke="#4fc3a0"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Minute hand */}
        <line
          x1="100"
          y1="100"
          x2={100 + Math.cos((minuteAngle * Math.PI) / 180) * 70}
          y2={100 + Math.sin((minuteAngle * Math.PI) / 180) * 70}
          stroke="#4fc3a0"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Second hand */}
        <line
          x1="100"
          y1="100"
          x2={100 + Math.cos((secondAngle * Math.PI) / 180) * 75}
          y2={100 + Math.sin((secondAngle * Math.PI) / 180) * 75}
          stroke="#ef4444"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Center dot */}
        <circle cx="100" cy="100" r="5" fill="#4fc3a0" />
      </svg>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.icon}>🕐</span>
          Blockchain Clock Comparison
        </h1>
        <p className={styles.description}>
          Compare wall clock time with Aptos blockchain time across different timezones.
        </p>
      </div>

      <div className={styles.controls}>
        <div className={styles.controlSection}>
          <div className={styles.searchWrapper}>
            <div ref={autocompleteRef} className={styles.autocompleteWrapper}>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim()) {
                    setShowSuggestions(true);
                  }
                }}
                placeholder="Search and click to add timezone (e.g., UTC+5, America/New_York, Tokyo)"
                className={styles.searchInput}
                autoComplete="off"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className={styles.suggestions}>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className={styles.suggestionItem}
                      onClick={() => selectSuggestion(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.controlSection}>
          <div className={styles.controlGrid}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={isSmooth}
                onChange={(e) => setIsSmooth(e.target.checked)}
                className={styles.checkbox}
              />
              <span>Smooth Mode</span>
            </label>

            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={isAnalog}
                onChange={(e) => setIsAnalog(e.target.checked)}
                className={styles.checkbox}
              />
              <span>Analog Clock</span>
            </label>

            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={accountForLatency}
                onChange={(e) => setAccountForLatency(e.target.checked)}
                className={styles.checkbox}
              />
              <span>Account for Latency</span>
            </label>

            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={showPreciseSeconds}
                onChange={(e) => setShowPreciseSeconds(e.target.checked)}
                className={styles.checkbox}
              />
              <span>Precise Seconds</span>
            </label>

            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={is24Hour}
                onChange={(e) => setIs24Hour(e.target.checked)}
                className={styles.checkbox}
              />
              <span>24-Hour Format</span>
            </label>
          </div>

          <div className={styles.pollControl}>
            <label className={styles.pollLabel}>
              Poll Interval: <strong>{pollInterval}ms</strong>
            </label>
            <input
              type="range"
              min="500"
              max="10000"
              step="500"
              value={pollInterval}
              onChange={(e) => setPollInterval(Number(e.target.value))}
              className={styles.slider}
            />
          </div>
        </div>
      </div>

      <div className={styles.clocksContainer}>
        {timezones.map((tz) => {
          const state = clockStates.get(tz.id);
          if (!state) return null;

          const wallTimeFormatted = formatTime(state.wallTime, tz.offset, isAnalog);
          const aptosTimeFormatted = formatTime(state.aptosTime, tz.offset, isAnalog);
          const diffMs = state.timeDiff;

          return (
            <div key={tz.id} className={styles.clockRow}>
              <div className={styles.clockRowHeader}>
                <h3 className={styles.timezoneName}>{tz.name}</h3>
                {timezones.length > 1 && (
                  <button
                    onClick={() => removeTimezone(tz.id)}
                    className={styles.removeButton}
                    aria-label="Remove timezone"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className={styles.clockPair}>
                <div className={styles.clockCard}>
                  <div className={styles.clockLabel}>
                    <span className={styles.clockIcon}>🌍</span>
                    Wall Time
                  </div>
                  <div className={styles.clockDisplay}>
                    {isAnalog && typeof wallTimeFormatted === 'object' ? (
                      <AnalogClock {...wallTimeFormatted} />
                    ) : (
                      <div className={styles.digitalTime}>{wallTimeFormatted as string}</div>
                    )}
                  </div>
                </div>

                <div className={styles.clockCard}>
                  <div className={styles.clockLabel}>
                    <span className={styles.clockIcon}>⬢</span>
                    Aptos Time
                    {isFetching && <span className={styles.fetchingIndicator}>↻</span>}
                  </div>
                  <div className={styles.clockDisplay}>
                    {isAnalog && typeof aptosTimeFormatted === 'object' ? (
                      <AnalogClock {...aptosTimeFormatted} />
                    ) : (
                      <div className={styles.digitalTime}>{aptosTimeFormatted as string}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.statsBar}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Difference:</span>
                  <span className={styles.statValue} style={{ color: getDriftColor(diffMs) }}>
                    {diffMs >= 0 ? '+' : ''}
                    {(diffMs / 1000).toFixed(3)}s
                  </span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Latency:</span>
                  <span className={styles.statValue}>{state.latencyMs.toFixed(1)}ms</span>
                </div>
                {accountForLatency && (
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Correction:</span>
                    <span className={styles.statValue}>
                      +{state.latencyCorrection.toFixed(1)}ms
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.info}>
        <h3 className={styles.infoTitle}>About This Tool</h3>
        <ul className={styles.infoList}>
          <li>
            <strong>Smooth Mode:</strong> Aptos clock advances continuously and adjusts when
            fetching new data from the blockchain. Wall clock always advances smoothly.
          </li>
          <li>
            <strong>Non-Smooth Mode:</strong> Aptos clock only updates when new data is fetched from
            the blockchain (jumps between updates)
          </li>
          <li>
            <strong>Precise Seconds:</strong> Show seconds with centisecond (0.01s) precision in
            digital format
          </li>
          <li>
            <strong>24-Hour Format:</strong> Toggle between 24-hour (00:00-23:59) and 12-hour (12:00
            AM-11:59 PM) time display
          </li>
          <li>
            <strong>Latency Correction:</strong> Accounts for network round-trip time by adding half
            the measured latency to the blockchain timestamp
          </li>
          <li>
            <strong>Time Drift Color Coding:</strong> Green (&lt;1s), Yellow (1-5s), Red (&gt;5s)
            indicates accuracy of blockchain time
          </li>
          <li>
            <strong>Persistent Settings:</strong> Your timezone selections and preferences are saved
            locally and restored on page reload
          </li>
          <li>
            <strong>Blockchain Time:</strong> Fetched from the{' '}
            <code>0x1::timestamp::CurrentTimeMicroseconds</code> resource on Aptos
          </li>
          <li>
            <strong>Timezone Support:</strong> Enter UTC offsets (UTC+5), IANA timezone names
            (America/New_York), or common city names (Tokyo)
          </li>
        </ul>
      </div>
    </div>
  );
}

export default ClockComparison;
