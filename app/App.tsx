import { Platform, StyleSheet, Text, View, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import React, { useState, useMemo, useEffect } from 'react';
import { SearchBar, FilterButtons, StateFilter, ActivityForm, TrailCard, TrailListView, TrailDetailPage, LoginScreen, UserProfileScreen } from './src/components';
import { MapView } from './src/components/MapView';
import { TrailFeature, GeoJSONFeatureCollection } from './src/types';
import { AuthProvider, useAuth } from './src/context/AuthContext';

const isWeb = Platform.OS === 'web';

// In production (Vercel), use same origin API
// In development (localhost), use local API on port 3001
const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api'
  : '/api'; // Use relative URL on Vercel (same origin)

type ViewMode = 'list' | 'map';

// Main app content (requires auth)
function MainApp() {
  // Load from static GeoJSON as fallback (small dataset for dev/emergency only)
  const fallbackGeojsonData = require('./assets/boulder_trails.geojson');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedTrail, setSelectedTrail] = useState<TrailFeature | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  
  // API vs Static data toggle
  const [useAPI, setUseAPI] = useState(true);
  const [loading, setLoading] = useState(useAPI);
  const [apiData, setApiData] = useState<GeoJSONFeatureCollection | null>(null);

  // Fetch available states on mount
  useEffect(() => {
    if (!useAPI || !isWeb) return;

    const fetchStates = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/states`);
        if (!response.ok) throw new Error('Failed to fetch states');
        const data = await response.json();
        setAvailableStates(data.states || []);
      } catch (err) {
        console.error('Failed to fetch states:', err);
      }
    };

    fetchStates();
  }, [useAPI]);

  // Fetch trails from API on component mount or when filters change
  useEffect(() => {
    if (!useAPI || !isWeb) {
      setLoading(false);
      return;
    }

    const fetchTrails = async () => {
      setLoading(true);
      let lastError: Error | null = null;
      
      // Retry up to 3 times with exponential backoff
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const params = new URLSearchParams();
          if (selectedDifficulty && selectedDifficulty !== 'All') {
            params.append('difficulty', selectedDifficulty);
          }
          if (selectedState) {
            params.append('state', selectedState);
          }
          if (searchQuery) {
            params.append('search', searchQuery);
          }

          const url = `${API_BASE_URL}/trails?${params}`;
          console.log(`[Attempt ${attempt}/3] Fetching trails from: ${url}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
          
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          
          console.log('API response status:', response.status);
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log('API returned', Array.isArray(data) ? data.length : data.features?.length || 0, 'trails');
          
          // API returns array of trail objects directly, convert to GeoJSON format
          const features = Array.isArray(data) 
            ? data 
            : (data.features || []);
          
          // If API returned empty or invalid data, continue to next attempt or fallback
          if (!features || features.length === 0) {
            console.warn('API returned no trails');
            lastError = new Error('API returned no trails');
            continue; // Try again
          }
          
          setApiData({
            type: 'FeatureCollection',
            name: 'Trails',
            features: features.map((f: any, idx: number) => ({
              type: 'Feature',
              id: f.id || idx,
              geometry: f.geometry,
              properties: f.properties || {
                name: f.name,
                difficulty: f.difficulty,
                length_meters: f.length_meters,
                estimated_difficulty: f.estimated_difficulty,
                state: f.state,
                ...f
              },
            })),
          });
          
          console.log('Successfully loaded trails from API');
          setLoading(false);
          return; // Success!
          
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          lastError = error;
          console.warn(`Attempt ${attempt} failed: ${error.message}`);
          
          if (attempt < 3) {
            // Exponential backoff: 1s, 2s, 4s
            const backoffMs = Math.pow(2, attempt - 1) * 1000;
            console.log(`Retrying in ${backoffMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
          }
        }
      }
      
      // All retries failed, fall back to static data
      console.error('All API attempts failed, falling back to static data:', lastError);
      setUseAPI(false);
      setLoading(false);
    };

    fetchTrails();
  }, [searchQuery, selectedDifficulty, selectedState, useAPI]);

  // Use API data if available, otherwise fall back to static
  const geojsonData = useAPI && apiData ? apiData : fallbackGeojsonData;
  
  // Enrich features with IDs if not from API
  const enrichedData = useMemo(() => ({
    ...geojsonData,
    features: (geojsonData.features || []).map((f: any, idx: number) => ({
      ...f,
      id: f.id || `trail-${idx}`,
    })),
  }), [geojsonData]);

  // Filter trails by search and difficulty
  const filteredData = useMemo(() => {
    const filtered = enrichedData.features.filter((feature: TrailFeature) => {
      const name = feature.properties.name.toLowerCase();
      const matchesSearch = searchQuery === '' || name.includes(searchQuery.toLowerCase());
      const matchesDifficulty = !selectedDifficulty || selectedDifficulty === 'All' || 
        feature.properties.estimated_difficulty === selectedDifficulty;
      const matchesState = !selectedState || feature.properties.state === selectedState;
      
      return matchesSearch && matchesDifficulty && matchesState;
    });
    return { ...enrichedData, features: filtered };
  }, [enrichedData, searchQuery, selectedDifficulty, selectedState]);

  const handleFavoritePress = (trail: TrailFeature) => {
    const trailId = String(trail.id);
    const newFavorites = new Set(favorites);
    if (newFavorites.has(trailId)) {
      newFavorites.delete(trailId);
    } else {
      newFavorites.add(trailId);
    }
    setFavorites(newFavorites);
  };

  if (!isWeb) {
    return (
      <View style={styles.container}>
        <Text>Map not supported on native yet in this prototype.</Text>
      </View>
    );
  }

  // Show trail detail page if a trail is selected
  if (selectedTrail && showActivityForm) {
    return (
      <View style={styles.container}>
        <ActivityForm
          selectedTrailName={selectedTrail.properties.name}
          selectedTrailDistance={selectedTrail.properties.length_km || selectedTrail.properties.length_meters / 1000}
          onActivityStart={() => {
            setShowActivityForm(false);
            setSelectedTrail(null);
          }}
        />
      </View>
    );
  }

  if (selectedTrail) {
    return (
      <View style={styles.container}>
        <TrailDetailPage
          trail={selectedTrail}
          onClose={() => setSelectedTrail(null)}
          onStartActivity={() => setShowActivityForm(true)}
          isFavorite={favorites.has(String(selectedTrail.id))}
          onFavoritePress={() => handleFavoritePress(selectedTrail)}
        />
      </View>
    );
  }

  // Main content area
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🥾 OpenTrails</Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === 'list' && styles.viewToggleBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[styles.viewToggleBtnText, viewMode === 'list' && styles.viewToggleBtnTextActive]}>
              📋 Tiles
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === 'map' && styles.viewToggleBtnActive]}
            onPress={() => setViewMode('map')}
          >
            <Text style={[styles.viewToggleBtnText, viewMode === 'map' && styles.viewToggleBtnTextActive]}>
              🗺️ Map
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

      {/* Filters */}
      <View style={styles.filtersSection}>
        <View style={styles.filterRow}>
          <StateFilter 
            states={availableStates}
            selectedState={selectedState}
            onStateChange={setSelectedState}
          />
          <FilterButtons 
            difficulties={['All', 'Easy', 'Moderate', 'Strenuous']}
            selectedDifficulty={selectedDifficulty || 'All'}
            onDifficultyChange={(d) => setSelectedDifficulty(d === 'All' ? null : d)}
          />
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {viewMode === 'list' ? (
          <TrailListView
            trails={filteredData.features}
            searchQuery={searchQuery}
            selectedDifficulty={selectedDifficulty}
            selectedState={selectedState}
            onTrailPress={setSelectedTrail}
            onFavoritePress={handleFavoritePress}
            favorites={favorites}
            loading={loading && useAPI}
          />
        ) : (
          <MapView
            trails={filteredData.features}
            selectedTrail={selectedTrail}
            onTrailPress={setSelectedTrail}
            loading={loading && useAPI}
          />
        )}
      </ScrollView>
    </View>
  );
}

// Auth wrapper component that handles login/signup flow
function AuthenticationFlow() {
  const { user, guestUser, isAuthenticated, loading } = useAuth();
  const [screen, setScreen] = useState<'login' | 'app' | 'profile'>('login');

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingScreenText}>Loading...</Text>
      </View>
    );
  }

  // Show login if neither authenticated nor guest
  if (!isAuthenticated) {
    return <LoginScreen onSuccess={() => setScreen('app')} />;
  }

  // Show profile screen if user is logged in and profile screen is active
  if (screen === 'profile' && user) {
    return (
      <UserProfileScreen 
        onActivityPress={() => setScreen('app')}
        onSettingsPress={() => setScreen('app')}
      />
    );
  }

  // Show app content (authenticated user or guest)
  return (
    <View style={styles.appWrapper}>
      {/* Header bar with title and profile/logout button */}
      <View style={styles.topBar}>
        <Text style={styles.appTitle}>🥾 OpenTrails</Text>
        {user ? (
          <Text 
            style={styles.profileButton}
            onPress={() => setScreen('profile')}
          >
            👤 {user.displayName || user.email?.split('@')[0] || 'Profile'}
          </Text>
        ) : guestUser ? (
          <Text style={styles.guestBadge}>👥 Guest</Text>
        ) : null}
      </View>
      <MainApp />
    </View>
  );
}

// Root component - wrap with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AuthenticationFlow />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingScreenText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  appWrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  appTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  profileButton: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  guestBadge: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  viewToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  viewToggleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#e5e7eb',
  },
  viewToggleBtnActive: {
    backgroundColor: '#3b82f6',
  },
  viewToggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  viewToggleBtnTextActive: {
    color: '#fff',
  },
  filtersSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 8,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  mapPlaceholderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    maxWidth: 300,
  },
});