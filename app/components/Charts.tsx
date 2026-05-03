"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const RevenueLineChart = ({ data, labels }: { data: number[]; labels: string[] }) => {
  const chartData = {
    labels,
    datasets: [
      {
        data,
        borderColor: "#519CAB",
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 150);
          gradient.addColorStop(0, "rgba(81, 156, 171, 0.4)");
          gradient.addColorStop(1, "rgba(81, 156, 171, 0)");
          return gradient;
        },
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
  };

  return <Line data={chartData} options={options} />;
};

export const PerformanceBarChart = ({ data, labels }: { data: number[]; labels: string[] }) => {
  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: "#C3E7F1",
        hoverBackgroundColor: "#519CAB",
        borderRadius: 8,
        barThickness: 40,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false } },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0,0,0,0.03)", drawTicks: false },
        border: { display: false },
        ticks: { font: { size: 10 } },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export const RevenueGauge = ({ collected, expected }: { collected: number; expected: number }) => {
  const percentage = Math.min(100, Math.round((collected / expected) * 100)) || 0;
  
  const chartData = {
    datasets: [
      {
        data: [percentage, 100 - percentage],
        backgroundColor: ["#FFC64F", "#f3f4f6"],
        borderWidth: 0,
        circumference: 270,
        rotation: 225,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "85%",
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <Doughnut data={chartData} options={options} />
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
        <span className="text-2xl font-display font-black text-brand-primary">{percentage}%</span>
        <span className="text-token-micro font-bold text-brand-tertiary uppercase tracking-widest mt-[-4px]">Goal</span>
      </div>
    </div>
  );
};

