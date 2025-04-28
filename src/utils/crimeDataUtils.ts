// crimeDataUtils.ts
import type { ChartData, ChartOptions } from 'chart.js';

// 定義公共類型
export interface GeoFeature {
  properties: {
    發生地點: string;
    發生日期: string;
    案類: string;
    [key: string]: any;
  };
  geometry: any;
  type: string;
}

export interface GeoJsonData {
  type: string;
  features: GeoFeature[];
}

export interface MonthlyDataByDistrict {
  districts: string[];
  months: string[];
  monthlyData: Record<string, Record<string, number>>;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface StatsData {
  filteredCount: number;
  averagePerMonth: string;
  mostFrequentArea: string | null;
  mostFrequentCrimeType: string | null;
}

// 建立工具函數的 composable
export function useCrimeDataUtils() {
  // 行政區列表
  const districtList = [
    "中正區","大同區","中山區","松山區","大安區",
    "萬華區","信義區","士林區","北投區","內湖區",
    "南港區","文山區"
  ];

  // 犯罪類型列表
  const crimeTypes = ["住宅竊盜", "機車竊盜", "自行車竊盜", "汽車竊盜"];

  // 從「發生地點」字串中找第一個命中的行政區，fallback 為 "未知"
  function getDistrict(location: string): string {
    for (const d of districtList) {
      if (location.includes(d)) {
        return d;
      }
    }
    return '未知';
  }

  // 從日期中提取月份 (YYYY-MM)
  function getMonthFromDate(dateStr: string): string {
    try {
      // 確保日期格式正確，移除可能的時間部分
      const cleanDate = dateStr.split('T')[0];
      // 僅取年月部分
      return cleanDate.substring(0, 7);
    } catch (e) {
      return '未知';
    }
  }

  // 格式化月份顯示
  function formatMonth(yearMonth: string): string {
    const [year, month] = yearMonth.split('-');
    return `${year}年${month}月`;
  }

  // 格式化日期顯示
  function formatDisplayDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    return `${year}年${month}月${day}日`;
  }

  // 判斷日期是否在指定範圍內
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

  // 為每個區域生成顏色
  function getDistrictColor(district: string, index: number): string {
    const colors = [
      'rgb(255, 99, 132)',   // 紅色
      'rgb(54, 162, 235)',   // 藍色
      'rgb(75, 192, 192)',   // 青色
      'rgb(255, 159, 64)',   // 橙色
      'rgb(153, 102, 255)',  // 紫色
      'rgb(255, 205, 86)',   // 黃色
      'rgb(201, 203, 207)',  // 灰色
      'rgb(255, 99, 255)',   // 粉紅色
      'rgb(99, 255, 132)',   // 綠色
      'rgb(99, 132, 255)',   // 深藍色
      'rgb(255, 159, 255)',  // 粉紫色
      'rgb(159, 255, 159)'   // 淺綠色
    ];
    
    // 確保每個區域都有固定的顏色
    const districtIndex = districtList.indexOf(district);
    const colorIndex = districtIndex >= 0 ? districtIndex : index;
    
    return colors[colorIndex % colors.length];
  }

  // 處理並整理數據
  function processGeoData(
    geoData: GeoJsonData,
    dateRange: DateRange,
    selectedCrimeTypes: string[]
  ): MonthlyDataByDistrict {
    if (!geoData) {
      return { districts: [], months: [], monthlyData: {} };
    }
    
    const monthsSet = new Set<string>();
    const districtsSet = new Set<string>();
    const monthlyData: Record<string, Record<string, number>> = {};
    
    // 遍歷所有數據
    geoData.features.forEach(feature => {
      const properties = feature.properties;
      const date = properties.發生日期;
      const month = getMonthFromDate(date);
      const district = getDistrict(properties.發生地點);
      const crimeType = properties.案類;
      
      // 檢查日期是否在範圍內
      if (!isDateInRange(date, dateRange.start, dateRange.end)) {
        return;
      }
      
      // 檢查犯罪類型是否匹配（如果有選擇犯罪類型）
      if (selectedCrimeTypes.length > 0 && !selectedCrimeTypes.includes(crimeType)) {
        return;
      }
      
      if (month !== '未知' && district !== '未知') {
        // 記錄所有月份和行政區
        monthsSet.add(month);
        districtsSet.add(district);
        
        // 初始化區域的計數對象
        if (!monthlyData[district]) {
          monthlyData[district] = {};
        }
        
        // 累計該區域該月份的事件數
        monthlyData[district][month] = (monthlyData[district][month] || 0) + 1;
      }
    });
    
    // 排序月份
    const months = Array.from(monthsSet).sort();
    const districts = Array.from(districtsSet).sort();
    
    return {
      districts,
      months,
      monthlyData
    };
  }

  // 生成 Chart.js 數據
  function generateChartData(selectedDistricts: string[], data: MonthlyDataByDistrict): ChartData<'line'> {
    if (selectedDistricts.length === 0 || !data || data.months.length === 0) {
      return { labels: [], datasets: [] };
    }
    
    // 為選中的行政區建立數據集
    const datasets = selectedDistricts.map((district, index) => {
      // 獲取該區域每月的數據
      const dataPoints = data.months.map(month => {
        return data.monthlyData[district]?.[month] || 0;
      });
      
      // 獲取顏色
      const color = getDistrictColor(district, index);
      
      return {
        label: district,
        data: dataPoints,
        borderColor: color,
        backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 3,
        pointHoverRadius: 5
      };
    });
    
    // 格式化月份標籤
    const labels = data.months.map(formatMonth);
    
    return {
      labels,
      datasets
    };
  }

  // 計算符合條件的數據筆數
  function getFilteredCount(
    geoData: GeoJsonData, 
    selectedAreas: string[], 
    selectedCrimeTypes: string[],
    dateRange: DateRange
  ): number {
    if (!geoData || selectedAreas.length === 0) return 0;
    
    return geoData.features.filter(feature => {
      const district = getDistrict(feature.properties.發生地點);
      const date = feature.properties.發生日期;
      const crimeType = feature.properties.案類;
      
      // 檢查日期範圍
      const dateInRange = isDateInRange(date, dateRange.start, dateRange.end);
      
      // 檢查區域
      const districtMatch = selectedAreas.includes(district);
      
      // 檢查犯罪類型
      const crimeTypeMatch = selectedCrimeTypes.length === 0 || selectedCrimeTypes.includes(crimeType);
      
      return dateInRange && districtMatch && crimeTypeMatch;
    }).length;
  }

  // 計算統計數據
  function calculateStats(
    geoData: GeoJsonData,
    processedData: MonthlyDataByDistrict | null,
    selectedAreas: string[],
    selectedCrimeTypes: string[],
    dateRange: DateRange
  ): StatsData {
    // 計算過濾後的總數
    const filteredCount = getFilteredCount(
      geoData, 
      selectedAreas, 
      selectedCrimeTypes, 
      dateRange
    );
    
    // 計算平均每月案件數
    let averagePerMonth = '0';
    if (processedData && filteredCount) {
      const monthCount = processedData.months.length;
      if (monthCount > 0) {
        averagePerMonth = (filteredCount / monthCount).toFixed(1);
      }
    }
    
    // 計算最高發生地區
    let mostFrequentArea = null;
    if (processedData && selectedAreas.length) {
      const { monthlyData } = processedData;
      const areaCounts: Record<string, number> = {};
      
      selectedAreas.forEach(area => {
        if (monthlyData[area]) {
          areaCounts[area] = Object.values(monthlyData[area])
            .reduce((sum: any, count: any) => sum + count, 0);
        } else {
          areaCounts[area] = 0;
        }
      });
      
      mostFrequentArea = Object.entries(areaCounts)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .map(entry => entry[0])[0] || null;
    }
    
    // 計算主要犯罪類型
    let mostFrequentCrimeType = null;
    if (selectedCrimeTypes.length) {
      // 如果有選擇犯罪類型，就用第一個（實際項目中應該計算最頻繁的類型）
      mostFrequentCrimeType = selectedCrimeTypes[0];
    } else if (geoData && selectedAreas.length) {
      // 如果沒有選擇犯罪類型，就計算實際的最頻繁類型
      const crimeTypeCounts: Record<string, number> = {};
      
      geoData.features.forEach(feature => {
        const district = getDistrict(feature.properties.發生地點);
        const date = feature.properties.發生日期;
        const crimeType = feature.properties.案類;
        
        // 只計算符合篩選條件的數據
        if (
          isDateInRange(date, dateRange.start, dateRange.end) &&
          selectedAreas.includes(district)
        ) {
          crimeTypeCounts[crimeType] = (crimeTypeCounts[crimeType] || 0) + 1;
        }
      });
      
      if (Object.keys(crimeTypeCounts).length > 0) {
        mostFrequentCrimeType = Object.entries(crimeTypeCounts)
          .sort((a, b) => b[1] - a[1])
          .map(entry => entry[0])[0] || null;
      }
    }
    
    return {
      filteredCount,
      averagePerMonth,
      mostFrequentArea,
      mostFrequentCrimeType
    };
  }

  // 獲取圖表配置選項
  function getChartOptions(selectedAreasLength: number): ChartOptions<'line'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 300
      },
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      elements: {
        point: {
          radius: selectedAreasLength > 3 ? 2 : 3,
          hoverRadius: 5
        },
        line: {
          borderWidth: 2
        }
      },
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: '犯罪數量月度趨勢'
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: function(context: any) {
              return `${context.dataset.label}: ${context.parsed.y} 件`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: '犯罪數量'
          }
        },
        x: {
          title: {
            display: true,
            text: '月份'
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        }
      }
    };
  }

  // 防抖函數
  function createDebounce() {
    let timeout: number | null = null;
    
    return function debounce(fn: Function, delay: number) {
      if (timeout) window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        fn();
        timeout = null;
      }, delay);
    };
  }

  // 返回所有工具函數
  return {
    districtList,
    crimeTypes,
    getDistrict,
    getMonthFromDate,
    formatMonth,
    formatDisplayDate,
    isDateInRange,
    getDistrictColor,
    processGeoData,
    generateChartData,
    getFilteredCount,
    calculateStats,
    getChartOptions,
    createDebounce
  };
}