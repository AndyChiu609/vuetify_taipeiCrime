<template>
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
  </template>
  
  <script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { useCrimeDataUtils } from '@/utils/crimeDataUtils'
  import type { DateRange } from '@/utils/crimeDataUtils'
  
  // 從工具引入方法
  const { 
    districtList,
    crimeTypes,
    formatDisplayDate,
    createDebounce
  } = useCrimeDataUtils();
  
  // 定義props
  const props = defineProps<{
    isLoading: boolean
  }>();
  
  // 定義emits
  const emit = defineEmits<{
    (e: 'update:selectedAreas', value: string[]): void
    (e: 'update:selectedCrimeTypes', value: string[]): void
    (e: 'update:dateRange', value: DateRange): void
    (e: 'filter-change'): void
  }>();
  
  // 內部狀態
  const selectedAreas = ref<string[]>([]);
  const selectedCrimeTypes = ref<string[]>([]);
  const dateRange = ref({
    start: '2014-01-01',
    end: '2023-12-31'
  });
  const debounce = createDebounce();
  
  // 切換選中的區域
  function toggleArea(area: string) {
    const index = selectedAreas.value.indexOf(area);
    if (index === -1) {
      selectedAreas.value.push(area);
    } else {
      selectedAreas.value.splice(index, 1);
    }
    emit('update:selectedAreas', [...selectedAreas.value]);
  }
  
  // 切換選中的犯罪類型
  function toggleCrimeType(crimeType: string) {
    const index = selectedCrimeTypes.value.indexOf(crimeType);
    if (index === -1) {
      selectedCrimeTypes.value.push(crimeType);
    } else {
      selectedCrimeTypes.value.splice(index, 1);
    }
    emit('update:selectedCrimeTypes', [...selectedCrimeTypes.value]);
  }
  
  // 計算所有唯一的行政區
  const uniqueAreas = computed(() => {
    return districtList;
  });
  
  // 監聽篩選條件變化
  watch([selectedAreas, selectedCrimeTypes, dateRange], () => {
    debounce(() => {
      emit('update:dateRange', { ...dateRange.value });
      emit('filter-change');
    }, 300);
  }, { deep: true });
  </script>
  
  <style scoped>
  .filter-container {
    background-color: rgba(30, 30, 30, 0.9);
    border: 1px solid rgba(80, 80, 80, 0.5);
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 24px;
  }
  </style>