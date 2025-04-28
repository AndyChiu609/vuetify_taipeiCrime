<template>
  <div class="crime-dashboard-container">
    <!-- 篩選容器 -->
    <v-container class="filter-container mb-6 rounded-lg">
      <h2 class="text-h5 mb-4">數據篩選</h2>
      
      <!-- 時間範圍 -->
      <div class="mb-5">
        <h3 class="text-subtitle-1 mb-2">時間範圍</h3>
        <v-row>
          <v-col cols="12" sm="6">
            <div class="d-flex align-center">
              <span class="mr-2">起始：</span>
              <v-text-field
                v-model="dateRange.start"
                type="date"
                density="compact"
                :disabled="isLoading"
                :min="'2014-01-01'"
                :max="'2023-12-31'"
                hide-details
              ></v-text-field>
            </div>
          </v-col>
          <v-col cols="12" sm="6">
            <div class="d-flex align-center">
              <span class="mr-2">結束：</span>
              <v-text-field
                v-model="dateRange.end"
                type="date"
                density="compact"
                :disabled="isLoading"
                :min="'2014-01-01'"
                :max="'2023-12-31'"
                hide-details
              ></v-text-field>
            </div>
          </v-col>
        </v-row>
      </div>
      
      <!-- 犯罪類型 -->
      <div class="mb-5">
        <h3 class="text-subtitle-1 mb-2">犯罪類型</h3>
        <div class="d-flex flex-wrap">
          <v-btn
            v-for="crimeType in crimeTypes"
            :key="crimeType"
            variant="outlined"
            :color="selectedCrimeTypes.includes(crimeType) ? 'primary' : 'default'"
            :class="[
              'me-2 mb-2', 
              selectedCrimeTypes.includes(crimeType) ? 'bg-primary-lighten-4' : ''
            ]"
            @click="toggleCrimeType(crimeType)"
            :disabled="isLoading"
          >
            {{ crimeType }}
          </v-btn>
        </div>
      </div>
      
      <!-- 行政區 -->
      <div>
        <h3 class="text-subtitle-1 mb-2">行政區</h3>
        <div class="d-flex flex-wrap">
          <v-btn
            v-for="area in uniqueAreas"
            :key="area"
            variant="outlined"
            :color="selectedAreas.includes(area) ? 'primary' : 'default'"
            :class="[
              'me-2 mb-2', 
              selectedAreas.includes(area) ? 'bg-primary-lighten-4' : ''
            ]"
            @click="toggleArea(area)"
            :disabled="isLoading"
          >
            {{ area }}
          </v-btn>
        </div>
      </div>
      
      <!-- 當前選擇的顯示 -->
      <div v-if="selectedAreas.length > 0" class="mt-4">
        當前選擇：
        <v-chip-group>
          <v-chip v-if="selectedCrimeTypes.length > 0" variant="outlined">
            {{ selectedCrimeTypes.join(', ') }}
          </v-chip>
          <v-chip v-if="selectedAreas.length > 0" variant="outlined">
            {{ selectedAreas.join(', ') }}
          </v-chip>
          <v-chip variant="outlined">
            {{ formatDisplayDate(dateRange.start) }} 至 {{ formatDisplayDate(dateRange.end) }}
          </v-chip>
        </v-chip-group>
      </div>
    </v-container>

    <!-- 數據視覺化容器 -->
    <v-container v-if="!isLoading && selectedAreas.length > 0" class="visualization-container rounded-lg">
      <h2 class="text-h5 mb-4">數據視覺化</h2>
      
      <!-- 數據卡片 -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" md="3">
          <v-card class="stat-card">
            <v-card-text class="text-center">
              <div class="text-body-2">總案件數</div>
              <div class="text-h4">{{ stats.filteredCount }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <v-card class="stat-card">
            <v-card-text class="text-center">
              <div class="text-body-2">平均每月案件</div>
              <div class="text-h4">{{ stats.averagePerMonth }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <v-card class="stat-card">
            <v-card-text class="text-center">
              <div class="text-body-2">最高發生地區</div>
              <div class="text-h4">{{ stats.mostFrequentArea || '無數據' }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <v-card class="stat-card">
            <v-card-text class="text-center">
              <div class="text-body-2">主要犯罪類型</div>
              <div class="text-h4">{{ stats.mostFrequentCrimeType || '無數據' }}</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- 圖表 -->
      <v-card>
        <v-card-title>各區域犯罪數量月度趨勢</v-card-title>
        <v-card-text>
          <div v-if="isLoading" class="d-flex justify-center align-center" style="height: 400px;">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </div>
          <div v-else-if="chartData.datasets.length > 0" style="height: 400px;">
            <Line 
              :data="chartData" 
              :options="chartOptions"
            />
          </div>
          <div v-else class="text-center pa-6" style="height: 400px;">
            <v-icon size="large" color="grey" class="mb-2">mdi-chart-line</v-icon>
            <div>無可顯示的數據，請調整篩選條件</div>
          </div>
        </v-card-text>
      </v-card>
    </v-container>
    
    <!-- 未選擇區域時的提示 -->
    <v-container v-else-if="!isLoading && selectedAreas.length === 0" class="text-center py-12">
      <v-icon size="64" color="grey" class="mb-4">mdi-map-marker-question</v-icon>
      <h3 class="text-h5 mb-2">尚未選擇任何區域</h3>
      <p class="text-body-1">請在上方選擇至少一個行政區以顯示數據</p>
    </v-container>
    
    <!-- 載入中提示 -->
    <v-container v-else class="text-center py-12">
      <v-progress-circular indeterminate size="64" color="primary" class="mb-4"></v-progress-circular>
      <h3 class="text-h5">數據載入中...</h3>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { useGeoStore } from '@/stores/geoStore'
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js'
import { Line } from 'vue-chartjs'
import { useCrimeDataUtils } from '@/utils/crimeDataUtils'
import type { StatsData } from '@/utils/crimeDataUtils'

// 註冊 ChartJS 組件
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend
)

// 從工具引入方法
const { 
  districtList,
  crimeTypes,
  processGeoData,
  generateChartData,
  formatDisplayDate,
  getChartOptions,
  calculateStats,
  createDebounce
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
const debounce = createDebounce();

// 切換選中的區域
function toggleArea(area: string) {
  const index = selectedAreas.value.indexOf(area);
  if (index === -1) {
    selectedAreas.value.push(area);
  } else {
    selectedAreas.value.splice(index, 1);
  }
}

// 切換選中的犯罪類型
function toggleCrimeType(crimeType: string) {
  const index = selectedCrimeTypes.value.indexOf(crimeType);
  if (index === -1) {
    selectedCrimeTypes.value.push(crimeType);
  } else {
    selectedCrimeTypes.value.splice(index, 1);
  }
}

// 計算所有唯一的行政區
const uniqueAreas = computed(() => {
  return districtList;
});

// 圖表數據
const chartData = computed(() => {
  if (!processedData.value) return { labels: [], datasets: [] };
  return generateChartData(selectedAreas.value, processedData.value);
});

// 圖表選項
const chartOptions = computed(() => {
  return getChartOptions(selectedAreas.value.length);
});

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

// 監聽篩選條件變化
watch([selectedAreas, selectedCrimeTypes, dateRange], () => {
  debounce(() => {
    updateAllData();
  }, 300);
}, { deep: true });

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

.filter-container, .visualization-container {
  background-color: rgba(30, 30, 30, 0.9);
  border: 1px solid rgba(80, 80, 80, 0.5);
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
}

.stat-card {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(50, 50, 50, 0.7);
  border: 1px solid rgba(100, 100, 100, 0.5);
}
</style>