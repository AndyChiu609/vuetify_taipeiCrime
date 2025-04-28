<template>
  <div class="crime-dashboard-container">
    <!-- 數據篩選組件 -->
    <CrimeFilter 
      :is-loading="isLoading"
      v-model:selected-areas="selectedAreas"
      v-model:selected-crime-types="selectedCrimeTypes"
      v-model:date-range="dateRange"
      @filter-change="updateAllData"
    />

    <!-- 數據視覺化組件 -->
    <CrimeVisualization 
      :is-loading="isLoading"
      :selected-areas="selectedAreas"
      :stats="stats"
      :processed-data="processedData"
    />
    
    <!-- 詳細數據組件 -->
    <CrimeDetails
      :is-loading="isLoading"
      :selected-areas="selectedAreas"
      :selected-crime-types="selectedCrimeTypes"
      :date-range="dateRange"
      :geo-data="geoData"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useGeoStore } from '@/stores/geoStore'
import { useCrimeDataUtils } from '@/utils/crimeDataUtils'
import type { StatsData } from '@/utils/crimeDataUtils'
import CrimeFilter from '@/components/CrimeFilter.vue'
import CrimeVisualization from '@/components/CrimeVisualization.vue'
import CrimeDetails from '@/components/CrimeDetails.vue'

// 從工具引入方法
const { 
  processGeoData,
  calculateStats
} = useCrimeDataUtils();

const geo = useGeoStore()
const selectedAreas = ref<string[]>([])
const selectedCrimeTypes = ref<string[]>([])
const isLoading = ref(true)
const geoData = ref<any>(null)
const processedData = ref<any>(null)
const stats = ref<StatsData>({
  filteredCount: 0,
  averagePerMonth: '0',
  mostFrequentArea: null,
  mostFrequentCrimeType: null
})
const dateRange = ref({
  start: '2014-01-01',
  end: '2023-12-31'
})

// 更新所有數據
function updateAllData() {
  if (!geoData.value) return;
  
  // 重新處理數據
  processedData.value = processGeoData(
    geoData.value, 
    dateRange.value, 
    selectedCrimeTypes.value
  );
  
  // 更新統計數據
  stats.value = calculateStats(
    geoData.value,
    processedData.value,
    selectedAreas.value,
    selectedCrimeTypes.value,
    dateRange.value
  );
  
  console.log(`篩選條件已更新，符合條件的資料筆數: ${stats.value.filteredCount}`);
}

// 初始化
onMounted(async () => {
  isLoading.value = true;
  
  try {
    // 從 store 獲取 GeoJSON 數據
    const data = await geo.fetchGeoJson();
    geoData.value = data;
    
    // 更新所有數據
    updateAllData();
  } catch (error) {
    console.error('無法處理數據:', error);
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.crime-dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
}
</style>