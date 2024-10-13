import Chart from 'chart.js/auto';
import { ChartItem } from 'chart.js/auto';

let netSalesChart:any = null;

export const generateNetSalesBarChart = async(title:string,data:{date:string, amount:number }[]) => {
  const chartElement = document.getElementById('statistics_net_amount');
  if (!chartElement) {
    console.error("Element with ID 'statistics_net_amount' not found");
    return;
  }
  
  if (netSalesChart) {
    netSalesChart.destroy(); // Destroy the previous chart instance if it exists
  }

  netSalesChart = new Chart(
    chartElement as ChartItem,
    {
      type: 'line', // Change chart type to 'line' for an area chart
      data: {
        labels: data.map(row => row.date),
        datasets: [
          {
            label: title,
            data: data.map(row => row.amount),
            backgroundColor: '#00AAA9', // Area fill color
            borderColor: '#00AAA9', // Line color
            fill: true, // Fill area under the line
          }
        ]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true, // Optional: ensure y-axis starts at zero
            ticks: {
            callback: (value:any) => {
              return `S/. ${value.toFixed(2)}`; // Prefix and format as currency
            }
          }
        }
        }
      }
    }
  );
  return;
}

let ReservesQuantitiesChart:any = null;
export const generateReservesQuantities = async(title:string,data:{date:string, quantity:number }[]) => {
  const chartElement = document.getElementById('statistics_reserves_quantities');
  if (!chartElement) {
    console.error("Element with ID 'statistics_reserves_quantities' not found");
    return;
  }
  
  if (ReservesQuantitiesChart) {
    ReservesQuantitiesChart.destroy(); // Destroy the previous chart instance if it exists
  }

  ReservesQuantitiesChart = new Chart(
    chartElement as ChartItem,
    {
      type: 'bar', // Change chart type to 'line' for an area chart
      data: {
        labels: data.map(row => row.date),
        datasets: [
          {
            label: title,
            data: data.map(row => row.quantity),
            backgroundColor: '#00AAA9', // Area fill color
          }
        ]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true, // Optional: ensure y-axis starts at zero
          }
        }
      }
    }
  );
  return;
}



