<template>
    <div>
      <!-- 詳細數據容器 - 只有在選擇了區域且不在載入中時顯示 -->
      <v-container v-if="!isLoading && selectedAreas.length > 0 && filteredRecords.length > 0" class="details-container rounded-lg">
        <h2 class="text-h5 mb-4">詳細數據</h2>
        
        <!-- 詳細記錄表格 -->
        <v-table class="crime-table">
          <thead>
            <tr>
              <th class="text-left">時間</th>
              <th class="text-left">行政區</th>
              <th class="text-left">犯罪類型</th>
              <th class="text-right">案件數</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(record, index) in displayedRecords" :key="index">
              <td>{{ formatDate(record.date) }}</td>
              <td>{{ record.district }}</td>
              <td>{{ record.crimeType }}</td>
              <td class="text-right">{{ record.count }}</td>
            </tr>
          </tbody>
        </v-table>
        
        <!-- 分頁控制 -->
        <div class="d-flex justify-center mt-4">
          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="7"
            rounded
          ></v-pagination>
        </div>
      </v-container>
      
      <!-- 未選擇區域或無數據時的提示，與視覺化組件保持一致，不顯示任何內容 -->
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { useCrimeDataUtils } from '@/utils/crimeDataUtils'
  
  // 從工具引入方法
  const { 
    getDistrict,
    formatDisplayDate
  } = useCrimeDataUtils();
  
  // 定義props
  const props = defineProps<{
    isLoading: boolean,
    selectedAreas: string[],
    selectedCrimeTypes: string[],
    dateRange: { start: string, end: string },
    geoData: any | null
  }>();
  
  // 內部狀態
  const currentPage = ref(1);
  const itemsPerPage = ref(10);
  
  // 格式化日期顯示
  function formatDate(dateStr: string): string {
    return dateStr.split('T')[0];
  }
  
  // 根據篩選條件過濾並轉換數據
  const filteredRecords = computed(() => {
    if (!props.geoData || props.selectedAreas.length === 0) return [];
    
    const records: { date: string, district: string, crimeType: string, count: number }[] = [];
    
    // 創建一個映射來存儲每個唯一組合的計數
    const recordMap = new Map<string, { date: string, district: string, crimeType: string, count: number }>();
    
    props.geoData.features.forEach((feature: any) => {
      const properties = feature.properties;
      const date = properties.發生日期;
      const district = getDistrict(properties.發生地點);
      const crimeType = properties.案類;
      
      // 檢查是否符合篩選條件
      const dateInRange = isDateInRange(date, props.dateRange.start, props.dateRange.end);
      const districtMatch = props.selectedAreas.includes(district);
      const crimeTypeMatch = props.selectedCrimeTypes.length === 0 || props.selectedCrimeTypes.includes(crimeType);
      
      if (dateInRange && districtMatch && crimeTypeMatch) {
        // 創建唯一鍵
        const key = `${date}-${district}-${crimeType}`;
        
        if (recordMap.has(key)) {
          // 增加計數
          const record = recordMap.get(key)!;
          record.count += 1;
        } else {
          // 創建新記錄
          recordMap.set(key, {
            date,
            district,
            crimeType,
            count: 1
          });
        }
      }
    });
    
    // 將 Map 轉換為數組並按日期排序
    return Array.from(recordMap.values()).sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  });
  
  // 當前頁顯示的記錄
  const displayedRecords = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    return filteredRecords.value.slice(start, end);
  });
  
  // 總頁數
  const totalPages = computed(() => {
    return Math.ceil(filteredRecords.value.length / itemsPerPage.value);
  });
  
  // 檢查日期是否在範圍內的輔助函數
  function isDateInRange(dateStr: string, start: string, end: string): boolean {
    try {
      const date = new Date(dateStr);
      const startDate = new Date(start);
      const endDate = new Date(end);
      return date >= startDate && date <= endDate;
    } catch (e) {
      return false;
    }
  }
  
  // 當篩選條件變化時重置頁碼
  watch([() => props.selectedAreas, () => props.selectedCrimeTypes, () => props.dateRange], () => {
    currentPage.value = 1;
  }, { deep: true });
  </script>
  
  <style scoped>
  .details-container {
    background-color: rgba(30, 30, 30, 0.9);
    border: 1px solid rgba(80, 80, 80, 0.5);
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 24px;
  }
  
  .crime-table {
    background-color: transparent;
    border: 1px solid rgba(80, 80, 80, 0.5);
  }
  
  .crime-table :deep(th) {
    background-color: rgba(50, 50, 50, 0.7);
    color: rgba(255, 255, 255, 0.9);
  }
  
  .crime-table :deep(tr:nth-child(even)) {
    background-color: rgba(50, 50, 50, 0.3);
  }
  </style>