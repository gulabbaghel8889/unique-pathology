import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Search,
  Filter,
  Microscope,
  Clock,
  AlertCircle,
  CheckCircle2,
  TestTube2,
  ArrowRight,
  ArrowDown,
  Info,
  Loader2,
} from 'lucide-react'
import { apiRequest } from '../api.js'
import { PriceBadge } from '../components/PriceBadge.jsx'
import { useScrollReveal } from '../hooks/useScrollReveal.js'

const PAGE_SIZE = 6

export function TestsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') || ''
  const initialCategory = searchParams.get('category') || 'All Tests'

  const [tests, setTests] = useState([])
  const [categories, setCategories] = useState(['All Tests'])
  const [departments, setDepartments] = useState(['All Departments'])
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Infinite scroll / Load-on-scroll state
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const loadMoreRef = useRef(null)

  useEffect(() => {
    async function fetchTests() {
      setLoading(true)
      try {
        const data = await apiRequest('/tests')
        setTests(data.tests || [])
        if (data.categories) {
          setCategories(data.categories)
        }
        const depts = Array.from(new Set(data.tests?.map((t) => t.department) || []))
        setDepartments(['All Departments', ...depts])
      } catch (err) {
        setError('Could not load diagnostic test catalogue. Please check connection.')
      } finally {
        setLoading(false)
      }
    }
    fetchTests()
  }, [])

  // Sync state if URL params change
  useEffect(() => {
    const s = searchParams.get('search') || ''
    const c = searchParams.get('category') || 'All Tests'
    if (s !== searchTerm) setSearchTerm(s)
    if (c !== selectedCategory) setSelectedCategory(c)
  }, [searchParams])

  // Filter tests based on search, category, and department
  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      const matchesCategory =
        selectedCategory === 'All Tests' || t.category === selectedCategory
      const matchesDept =
        selectedDepartment === 'All Departments' || t.department === selectedDepartment
      const searchNeedle = searchTerm.toLowerCase().trim()
      const searchHaystack = `${t.name} ${t.shortCode || ''} ${t.description || ''} ${t.category} ${t.department}`.toLowerCase()
      const matchesSearch = !searchNeedle || searchHaystack.includes(searchNeedle)
      return matchesCategory && matchesDept && matchesSearch
    })
  }, [tests, selectedCategory, selectedDepartment, searchTerm])

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [searchTerm, selectedCategory, selectedDepartment])

  // Tests currently visible to the user
  const displayedTests = useMemo(() => {
    return filteredTests.slice(0, visibleCount)
  }, [filteredTests, visibleCount])

  const hasMore = visibleCount < filteredTests.length

  // Trigger scroll-reveal hook
  useScrollReveal([displayedTests.length, loading])

  // Infinite Scroll IntersectionObserver (loads more when scrolling down near bottom)
  useEffect(() => {
    if (!hasMore || isLoadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsLoadingMore(true)
          // Smooth simulated loading delay for realistic visual feedback
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredTests.length))
            setIsLoadingMore(false)
          }, 350)
        }
      },
      {
        root: null,
        rootMargin: '120px',
        threshold: 0.1,
      }
    )

    const el = loadMoreRef.current
    if (el) observer.observe(el)

    return () => {
      if (el) observer.unobserve(el)
    }
  }, [hasMore, isLoadingMore, filteredTests.length])

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
          Diagnostic Catalogue
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-[#073b66] tracking-tight">
          Pathology Tests & Medical Profiles
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl leading-6">
          Search routine blood work, metabolic panels, hormonal assays, and clinical pathology tests. Filter by specialty or preparation requirements.
        </p>
      </div>

      {/* Mandatory Regulatory / Ethical Notice */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
        <div className="flex gap-2.5">
          <Info size={18} className="shrink-0 text-amber-700 mt-0.5" />
          <div>
            <strong className="block font-bold">Important Notice on Tariff Display:</strong>
            Prices labeled as <span className="font-bold underline">Demo / Indicative</span> are illustrative values for starter evaluation. All diagnostic tariffs, sample collection protocols, and test availability must be confirmed by Unique Pathology staff in Mandideep before testing.
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setSearchParams({ search: e.target.value, category: selectedCategory })
              }}
              placeholder="Search by test name, short code (e.g. CBC, LFT, TSH), or keyword..."
              className="field pl-11"
            />
          </div>

          {/* Department selector */}
          <div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="field"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => {
                setSelectedCategory(c)
                setSearchParams({ search: searchTerm, category: c })
              }}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${
                selectedCategory === c
                  ? 'bg-[#073b66] text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-cyan-400 hover:bg-slate-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Test Results Header with Progress Indicator */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
        <span className="flex items-center gap-2">
          <span>
            Showing <strong className="text-[#073b66]">{displayedTests.length}</strong> of{' '}
            <strong className="text-[#073b66]">{filteredTests.length}</strong> diagnostic test
            {filteredTests.length === 1 ? '' : 's'}
          </span>
          {hasMore && (
            <span className="hidden sm:inline-block text-[11px] font-semibold text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
              Scroll down to load more
            </span>
          )}
        </span>

        {(searchTerm || selectedCategory !== 'All Tests' || selectedDepartment !== 'All Departments') && (
          <button
            onClick={() => {
              setSearchTerm('')
              setSelectedCategory('All Tests')
              setSelectedDepartment('All Departments')
              setSearchParams({})
            }}
            className="text-cyan-700 hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Grid of Tests */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-cyan-600 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-500">Loading diagnostic catalogue...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          <p className="font-bold">{error}</p>
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <TestTube2 size={36} className="mx-auto text-slate-400" />
          <h3 className="text-lg font-bold text-[#073b66]">No matching tests found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            We couldn't find any tests matching "{searchTerm}". Try checking your spelling or select another department.
          </p>
          <button
            onClick={() => {
              setSearchTerm('')
              setSelectedCategory('All Tests')
              setSelectedDepartment('All Departments')
            }}
            className="rounded-xl bg-[#073b66] px-4 py-2 text-xs font-bold text-white hover:bg-cyan-700"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayedTests.map((test, index) => (
              <article
                key={test.name}
                className="medical-card p-6 flex flex-col justify-between reveal-on-scroll is-visible"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-lg bg-cyan-50 px-2.5 py-1 text-[11px] font-bold text-cyan-800">
                      {test.department}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      <Clock size={12} />
                      {test.turnaroundHours}h TAT
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-[#073b66] leading-snug">{test.name}</h3>
                    {test.shortCode && (
                      <span className="inline-block text-xs font-black text-cyan-600 mt-0.5">
                        {test.shortCode}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-5 line-clamp-3">
                    {test.description}
                  </p>

                  {/* Clinical Specimen & Fasting info */}
                  <div className="space-y-1.5 rounded-xl bg-slate-50 p-3 text-[11px] text-slate-600 border border-slate-100">
                    <div className="flex items-start gap-1.5">
                      <strong className="text-slate-800 shrink-0">Sample:</strong>
                      <span>{test.sampleType || 'Venous Blood'}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <strong className="text-slate-800 shrink-0">Fasting:</strong>
                      <span className={test.fastingRequired ? 'text-amber-800 font-semibold' : 'text-slate-600'}>
                        {test.fastingDuration || (test.fastingRequired ? 'Overnight Fasting Required' : 'No Fasting Required')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <PriceBadge
                    pricePaise={test.pricePaise}
                    mrpPaise={test.mrpPaise}
                    isVerifiedPrice={test.isVerifiedPrice}
                    priceNote={test.priceNote}
                  />

                  <Link
                    to={`/book?test=${encodeURIComponent(test.name)}`}
                    className="rounded-xl bg-[#073b66] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-cyan-700 transition shrink-0 inline-flex items-center gap-1.5"
                  >
                    <span>Book</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* INFINITE SCROLL / LOAD ON SCROLL TARGET & INDICATOR */}
          {hasMore && (
            <div ref={loadMoreRef} className="mt-10 py-6 text-center">
              {isLoadingMore ? (
                <div className="flex flex-col items-center justify-center gap-2.5 text-cyan-800 animate-fadeIn">
                  <div className="h-9 w-9 animate-spin rounded-full border-3 border-cyan-600 border-t-transparent" />
                  <span className="text-xs font-bold text-slate-600 animate-pulse">
                    Loading more diagnostic tests...
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setIsLoadingMore(true)
                      setTimeout(() => {
                        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredTests.length))
                        setIsLoadingMore(false)
                      }, 300)
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl border-2 border-cyan-600/30 bg-cyan-50/70 hover:bg-cyan-100/80 px-6 py-3 text-xs font-extrabold text-[#073b66] shadow-sm hover:scale-[1.02] active:scale-95 transition"
                  >
                    <span>Scroll down or Click to load more ({filteredTests.length - displayedTests.length} remaining)</span>
                    <ArrowDown size={14} className="animate-bounce text-cyan-600" />
                  </button>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Scroll down or tap to reveal more tests
                  </p>
                </div>
              )}
            </div>
          )}

          {!hasMore && filteredTests.length > 0 && (
            <div className="mt-10 py-6 text-center border-t border-slate-100">
              <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 px-4 py-2 rounded-full border border-slate-200">
                <CheckCircle2 size={15} className="text-emerald-500" />
                All {filteredTests.length} diagnostic tests loaded
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
