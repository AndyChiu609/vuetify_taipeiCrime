<template>
    <div>
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
  import { computed } from 'vue'
  import { useCrimeDataUtils } from '@/utils/crimeDataUtils'
  import type { StatsData, MonthlyDataByDistrict } from '@/utils/crimeDataUtils'
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
    generateChartData,
    getChartOptions
  } = useCrimeDataUtils();
  
  // 定義props
  const props = defineProps<{
    isLoading: boolean,
    selectedAreas: string[],
    stats: StatsData,
    processedData: MonthlyDataByDistrict | null
  }>();
  
  // 圖表數據
  const chartData = computed(() => {
    if (!props.processedData) return { labels: [], datasets: [] };
    return generateChartData(props.selectedAreas, props.processedData);
  });
  
  // 圖表選項
  const chartOptions = computed(() => {
    return getChartOptions(props.selectedAreas.length);
  });
  </script>
  
  <style scoped>
  .visualization-container {
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