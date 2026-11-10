import "@/global.css";
import {Image, ScrollView, Text, View} from 'react-native';
import React from 'react';
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";
import {BarChart} from "react-native-gifted-charts";
import {icons} from "@/constants/icons";
import {INSIGHTS_EXPENSES, INSIGHTS_HISTORY, INSIGHTS_WEEKLY_DATA} from "@/constants/data";
import {formatCurrency} from "@/lib/utils";
import dayjs from "dayjs";
import ListHeading from "@/components/listHeading";

const SafeAreaView = styled(RNSafeAreaView);

const Insights = () => {
  const highlightedIndex = 3; // Thursday

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      {/* Header */}
      <View className="insights-header">
        <Image source={icons.back} className="insights-back-icon" />
        <Text className="insights-title">Monthly Insights</Text>
        <Image source={icons.menu} className="insights-menu-icon" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-30">
        {/* Upcoming Section */}
        <ListHeading title="Upcoming" />

        <View className="insights-chart-card">
          <BarChart
            data={INSIGHTS_WEEKLY_DATA.map((item, index) => ({
              value: item.value,
              label: item.label,
              frontColor: index === highlightedIndex ? "#ea7a53" : "#081126",
              topLabelComponent: index === highlightedIndex
                ? () => (
                    <View style={{
                      backgroundColor: "#fff8e7",
                      borderRadius: 6,
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                      borderWidth: 1,
                      borderColor: "rgba(0,0,0,0.1)",
                    }}>
                      <Text style={{color: "#ea7a53", fontSize: 12, fontWeight: "700"}}>
                        ${item.value}
                      </Text>
                    </View>
                  )
                : undefined,
            }))}
            width={320}
            height={180}
            showGradient={false}
            hideRules={false}
            hideYAxisText={true}
            yAxisLabelWidth={20}
            xAxisLabelTextStyle={{color: "#081126", fontSize: 12, fontWeight: "600"}}
            rulesColor="rgba(0,0,0,0.08)"
            spacing={28}
            barWidth={22}
            noOfSections={5}
            initialSpacing={10}
            yAxisThickness={0}
            xAxisThickness={0}
            labelWidth={30}
            barBorderRadius={4}
            roundedTop
          />
        </View>

        {/* Expenses Card */}
        <View className="insights-expenses-card">
          <View className="insights-expenses-left">
            <Text className="insights-expenses-label">Expenses</Text>
            <Text className="insights-expenses-period">{INSIGHTS_EXPENSES.period}</Text>
          </View>
          <View className="insights-expenses-right">
            <Text className="insights-expenses-amount">
              -{formatCurrency(INSIGHTS_EXPENSES.amount)}
            </Text>
            <Text className="insights-expenses-change">+{INSIGHTS_EXPENSES.changePercent}%</Text>
          </View>
        </View>

        {/* History Section */}
        <ListHeading title="History" />

        <View className="gap-4">
          {INSIGHTS_HISTORY.map((item) => (
            <View key={item.id} className="insights-history-card" style={{backgroundColor: item.color}}>
              <View className="insights-history-left">
                <Image source={item.icon} className="insights-history-icon" />
                <View className="insights-history-info">
                  <Text className="insights-history-name">{item.name}</Text>
                  <Text className="insights-history-date">
                    {dayjs(item.renewalDate).format("MMMM D, HH:mm")}
                  </Text>
                </View>
              </View>
              <View className="insights-history-right">
                <Text className="insights-history-price">
                  {formatCurrency(item.price)}
                </Text>
                <Text className="insights-history-billing">per month</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Insights;