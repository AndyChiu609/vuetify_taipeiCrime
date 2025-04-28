// src/stores/geoStore.ts
import { defineStore } from 'pinia'
import type { FeatureCollection } from 'geojson'

export const useGeoStore = defineStore('geo', {
  state: () => ({
    rawGeoJson: null as FeatureCollection | null,
    isLoading: false
  }),

  getters: {
    // 提供 rawGeoJson 的 getter
    geoJsonData: (state) => state.rawGeoJson
  },

  actions: {
    // 載入 GeoJSON 資料
    async fetchGeoJson() {
      if (this.rawGeoJson) return this.rawGeoJson; // 避免重複載入
      
      this.isLoading = true;
      try {
        const res = await fetch('/crime_data_cleaned.geojson');
        this.rawGeoJson = await res.json();
        return this.rawGeoJson;
      } catch (error) {
        console.error('無法載入 GeoJSON 資料:', error);
        return null;
      } finally {
        this.isLoading = false;
      }
    }
  }
});