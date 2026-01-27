import React from 'react';
 
const RevenueChart: React.FC = () => {
  const data = [
    { year: 'FY2023', val: 28, height: '56%', ebitda: '20%' },
    { year: 'FY2024', val: 30, height: '60%', ebitda: '20%' },
    { year: 'FY2025', val: 45, height: '90%', ebitda: '20%' }, 
    { year: 'FY2026', val: 50, height: '100%', ebitda: '20%' }, 
  ];
 
  return (
    <div className="chart-container">
      <h3>Total Revenue (USD Bn)</h3>
      <div className="legend">
        <span className="dot actuals"></span> Actuals
        <span className="dot forecast"></span> Forecast
        <span className="pill-legend">xx</span> EBITDA margin
      </div>
 
      <div className="bars-area">
        <div className="cagr-arrow">
            <span>CAGR (%)</span>
        </div>
 
        {data.map((item, index) => (
          <div key={index} className="bar-group">
            <div
                className="bar"
                style={{ height: item.height }}
                data-value={item.val}
            >
                <span className="bar-val">{item.val}</span>
            </div>
            <div className="year-label">{item.year}</div>
            <div className="ebitda-pill">{item.ebitda}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
 
export default RevenueChart;
 