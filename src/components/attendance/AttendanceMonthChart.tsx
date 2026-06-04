import React from 'react';
import { Dimensions, Text, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';

type Props = {
  records: any[];
  summary: any;
};

const screenWidth = Dimensions.get('window').width;

function getDayLabel(dateStr: string, index: number): string {
  const day = dateStr.slice(8, 10);
  // Only show label every 5 days to prevent overlap
  return (parseInt(day, 10) - 1) % 5 === 0 ? day : '';
}

export function AttendanceMonthChart({ records, summary }: Props) {
  const presentDays = summary?.present_days ?? 0;
  const absentDays = summary?.absent_days ?? 0;
  const weeklyOffDays = summary?.weekly_off_days ?? 0;
  const leaveDays = summary?.leave_days ?? 0;

  const chartRecords = (records ?? []).slice(0, 31);
  const labels = chartRecords.map((item: any, i: number) => getDayLabel(item.date ?? '', i));
  const hours = chartRecords.map((item: any) => Number(item.total_hours ?? 0));
  const hasHours = hours.some(v => v > 0);

  const totalForPie = presentDays + absentDays + weeklyOffDays + leaveDays;

  return (
    <>
      {/* Daily hours bar chart */}
      <View style={{ borderRadius: 18, backgroundColor: '#FFFFFF', padding: 14, marginBottom: 14, elevation: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '900', color: '#10233F', marginBottom: 4 }}>Daily Working Hours</Text>
        {hasHours ? (
          <BarChart
            data={{ labels, datasets: [{ data: hours }] }}
            width={screenWidth - 48}
            height={200}
            fromZero
            yAxisLabel=""
            yAxisSuffix="h"
            showValuesOnTopOfBars={false}
            chartConfig={{
              backgroundGradientFrom: '#FFFFFF',
              backgroundGradientTo: '#FFFFFF',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(16, 35, 63, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(107, 94, 79, ${opacity})`,
              barPercentage: 0.6,
              propsForBackgroundLines: { strokeDasharray: '4', stroke: '#F0EDE8' },
            }}
            style={{ borderRadius: 14, marginTop: 8 }}
          />
        ) : (
          <Text style={{ marginTop: 10, color: '#6B5E4F', fontSize: 13 }}>No working hours recorded this month yet.</Text>
        )}
      </View>

      {/* Attendance split pie chart */}
      {totalForPie > 0 && (
        <View style={{ borderRadius: 18, backgroundColor: '#FFFFFF', padding: 14, marginBottom: 14, elevation: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '900', color: '#10233F', marginBottom: 4 }}>Attendance Split</Text>
          <PieChart
            data={[
              { name: 'Present', population: presentDays, color: '#15803D', legendFontColor: '#10233F', legendFontSize: 12 },
              { name: 'Absent', population: absentDays, color: '#DC2626', legendFontColor: '#10233F', legendFontSize: 12 },
              { name: 'Weekly Off', population: weeklyOffDays, color: '#2563EB', legendFontColor: '#10233F', legendFontSize: 12 },
              { name: 'Leave', population: leaveDays, color: '#B45309', legendFontColor: '#10233F', legendFontSize: 12 },
            ].filter(d => d.population > 0)}
            width={screenWidth - 48}
            height={180}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="8"
            chartConfig={{ color: (opacity = 1) => `rgba(16, 35, 63, ${opacity})` }}
          />
        </View>
      )}
    </>
  );
}
