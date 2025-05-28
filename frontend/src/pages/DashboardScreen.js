import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Message from '../components/common/Message';
import Loader from '../components/common/Loader';
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
} from 'chart.js';
import { Pie, Bar, Line, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const DashboardScreen = () => {
  const { userInfo } = useContext(AuthContext);
  const [stats, setStats] = useState({
    counts: {
      households: 0,
      residents: 0,
      fees: 0,
      temporaryResidences: 0,
      temporaryAbsences: 0
    },
    financials: {
      monthlyRevenue: 0,
      revenueByType: {}
    },
    recentPayments: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!userInfo) {
          return;
        }
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };
        const { data } = await axios.get('/api/statistics/dashboard', config);
        setStats(data);
        setLoading(false);
      } catch (error) {
        setError('Không thể tải dữ liệu tổng quan');
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [userInfo]);
  
  // Generate monthly trend data based on current monthly revenue
  const monthlyTrend = useMemo(() => {
    // Sử dụng dữ liệu từ API nếu có
    if (stats.financials.monthlyTrend) {
      return {
        labels: stats.financials.monthlyTrend.labels,
        datasets: [
          {
            label: 'Doanh Thu Hàng Tháng',
            data: stats.financials.monthlyTrend.data,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            tension: 0.3,
          },
        ],
      };
    }
    
    // Fallback nếu không có dữ liệu từ API
    const months = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6'];
    const baseValue = stats.financials.monthlyRevenue || 10000000;
    
    // Generate random but consistent data points around the base value
    const data = months.map((_, index) => {
      // Create a consistent pattern based on month index
      const factor = 0.8 + ((index % 3) * 0.15);
      return Math.floor(baseValue * factor);
    });
    
    return {
      labels: months,
      datasets: [
        {
          label: 'Doanh Thu Hàng Tháng',
          data: data,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.3,
        },
      ],
    };
  }, [stats.financials.monthlyRevenue, stats.financials.monthlyTrend]);
  
  // Prepare data for revenue by fee type chart
  const revenueByTypeData = useMemo(() => {
    // Định nghĩa các màu cho biểu đồ
    const colors = {
      backgroundColor: [
        'rgba(255, 99, 132, 0.6)',  // Hồng
        'rgba(54, 162, 235, 0.6)',  // Xanh dương
        'rgba(255, 206, 86, 0.6)',  // Vàng
        'rgba(75, 192, 192, 0.6)',  // Xanh lá
        'rgba(153, 102, 255, 0.6)', // Tím
        'rgba(255, 159, 64, 0.6)',  // Cam
        'rgba(199, 199, 199, 0.6)'  // Xám
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)',
        'rgba(199, 199, 199, 1)'
      ]
    };

    // Lọc các loại phí có giá trị > 0 và sắp xếp theo giá trị giảm dần
    const revenueEntries = Object.entries(stats.financials.revenueByType)
      .filter(([_, value]) => value > 0)
      .sort((a, b) => b[1] - a[1]);
    
    // Tạo labels hiển thị cả tên loại phí và số tiền
    const labels = revenueEntries.map(([label, value]) => 
      `${label}: ${value.toLocaleString()} VND`
    );
    const values = revenueEntries.map(([_, value]) => value);

    return {
      labels: labels,
      datasets: [
        {
          label: 'Doanh Thu Tháng Hiện Tại',
          data: values,
          backgroundColor: colors.backgroundColor.slice(0, labels.length),
          borderColor: colors.borderColor.slice(0, labels.length),
          borderWidth: 1,
        },
      ],
    };
  }, [stats.financials.revenueByType]);
  
  // Prepare data for counts comparison chart
  const countsComparisonData = useMemo(() => ({
    labels: ['Hộ Gia Đình', 'Cư Dân'],
    datasets: [
      {
        label: 'Số Lượng',
        data: [
          stats.counts.households,
          stats.counts.residents
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1,
      },
    ],
  }), [stats.counts.households, stats.counts.residents]);
  
  // Customize chart options for each chart
  const pieChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 15,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: `Tỷ lệ doanh thu ${stats.financials.displayMonthName || 'tháng hiện tại'} theo loại phí`,
        font: {
          size: 14,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${value.toLocaleString()} VND (${percentage}%)`;
          },
          title: function(context) {
            // Lấy tên loại phí từ label (bỏ phần số tiền)
            const fullLabel = context[0].label;
            const feeTypeName = fullLabel.split(':')[0];
            return feeTypeName;
          }
        }
      }
    }
  }), [stats.financials.displayMonthName]);

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Số lượng đối tượng quản lý',
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Số lượng'
        }
      }
    }
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Doanh thu 6 tháng gần nhất',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            return `${label}: ${value.toLocaleString()} VND`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Doanh thu (VND)'
        },
        ticks: {
          callback: function(value) {
            return value.toLocaleString();
          }
        }
      }
    }
  };
  
  // Area chart (Line với fill)
  const areaChartOptions = {
    ...lineChartOptions,
    elements: { line: { fill: true } },
    plugins: {
      ...lineChartOptions.plugins,
      title: { ...lineChartOptions.plugins.title, text: 'Biểu đồ Doanh Thu (Area)' }
    }
  };
  const areaChartData = {
    ...monthlyTrend,
    datasets: monthlyTrend.datasets.map(ds => ({ ...ds, fill: true, backgroundColor: 'rgba(0,204,255,0.15)' }))
  };
  // Bar ngang cho thống kê số lượng
  const horizontalBarOptions = {
    ...barChartOptions,
    indexAxis: 'y',
    plugins: {
      ...barChartOptions.plugins,
      title: { ...barChartOptions.plugins.title, text: 'Thống Kê Số Lượng (Bar Ngang)' }
    }
  };
  
  return (
    <div style={{ 
      background: 'linear-gradient(135deg,rgb(226, 190, 231) 0%, #f5576c 100%)', 
      minHeight: '100vh',
      padding: '20px'
    }}>
      {/* Header với thiết kế hiện đại */}
      <div className="text-center mb-5 position-relative">
        <div style={{
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(15px)',
          borderRadius: '25px',
          padding: '25px',
          border: '1px solid rgba(255,255,255,0.25)',
          boxShadow: '0 8px 32px rgba(255,255,255,0.1)'
        }}>
          <h1 className="text-white mb-2 fw-bold" style={{ 
            fontSize: '2.2rem',
            textShadow: '2px 2px 8px rgba(0,0,0,0.2)',
            letterSpacing: '1px'
          }}>
            <i className="bi bi-speedometer2 me-3" style={{ fontSize: '2rem' }}></i>
            DASHBOARD QUẢN LÝ
          </h1>
          <p className="text-white mb-0" style={{ fontSize: '16px', opacity: '0.9' }}>
            {stats.financials.displayMonthName || (new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }))}
          </p>
        </div>
      </div>
      
      {error && <Message variant="danger">{error}</Message>}
      
      {loading ? (
        <Loader />
      ) : (
        <>
          {/* Cards thống kê với thiết kế mới */}
          <div className="row g-4 mb-5">
            {/* Card lớn cho doanh thu */}
            <div className="col-12 col-lg-6">
              <div style={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                borderRadius: '20px',
                padding: '25px',
                color: 'white',
                height: '180px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 8px 25px rgba(79, 172, 254, 0.4)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }} className="h-100 d-flex flex-column justify-content-between"
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0px)'}>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="mb-2" style={{ fontSize: '14px', fontWeight: '600', opacity: '0.9' }}>
                      TỔNG DOANH THU
                    </div>
                    <div className="fw-bold" style={{ fontSize: '2.2rem', lineHeight: '1.1' }}>
                      {stats.financials.monthlyRevenue.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '12px', opacity: '0.8', marginTop: '4px' }}>
                      VND
                    </div>
                  </div>
                  <div style={{ fontSize: '2.5rem', opacity: '0.4' }}>
                    <i className="bi bi-graph-up-arrow"></i>
                  </div>
                </div>
                <div className="d-flex justify-content-end">
                  <Link to="/payments" className="text-white text-decoration-none" style={{ 
                    fontSize: '13px',
                    background: 'rgba(255,255,255,0.2)',
                    padding: '6px 12px',
                    borderRadius: '15px',
                    transition: 'all 0.2s ease'
                  }}>
                    <i className="bi bi-arrow-right me-1"></i>Chi tiết
                  </Link>
                </div>
              </div>
            </div>

            {/* 3 cards nhỏ */}
            <div className="col-12 col-lg-6">
              <div className="row g-3 h-100">
                <div className="col-6">
                  <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '15px',
                    padding: '16px',
                    color: 'white',
                    height: '85px',
                    position: 'relative',
                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.3)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '600', opacity: '0.9', marginBottom: '4px' }}>
                        HỘ GIA ĐÌNH
                      </div>
                      <div className="fw-bold" style={{ fontSize: '1.8rem', lineHeight: '1' }}>
                        {stats.counts.households}
                      </div>
                    </div>
                    <div className="text-end">
                      <Link to="/households" className="text-white text-decoration-none" style={{ 
                        fontSize: '11px',
                        opacity: '0.9'
                      }}>
                        Chi tiết →
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div style={{
                    background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                    borderRadius: '15px',
                    padding: '16px',
                    color: '#2d3748',
                    height: '85px',
                    position: 'relative',
                    boxShadow: '0 6px 20px rgba(168, 237, 234, 0.3)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '600', opacity: '0.8', marginBottom: '4px' }}>
                        CƯ DÂN
                      </div>
                      <div className="fw-bold" style={{ fontSize: '1.8rem', lineHeight: '1' }}>
                        {stats.counts.residents}
                      </div>
                    </div>
                    <div className="text-end">
                      <Link to="/residents" className="text-decoration-none" style={{ 
                        fontSize: '11px',
                        color: '#2d3748',
                        opacity: '0.8'
                      }}>
                        Chi tiết →
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col-12">
                  <div style={{
                    background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                    borderRadius: '15px',
                    padding: '16px',
                    color: '#2d3748',
                    height: '85px',
                    position: 'relative',
                    boxShadow: '0 6px 20px rgba(252, 182, 159, 0.3)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                    <div className="d-flex justify-content-between align-items-center h-100">
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '600', opacity: '0.8', marginBottom: '4px' }}>
                          LOẠI PHÍ QUẢN LÝ
                        </div>
                        <div className="fw-bold" style={{ fontSize: '1.8rem', lineHeight: '1' }}>
                          {stats.counts.fees}
                        </div>
                      </div>
                      <div>
                        <Link to="/fees" className="text-decoration-none d-flex align-items-center justify-content-center" style={{ 
                          color: '#2d3748',
                          width: '35px',
                          height: '35px',
                          background: 'rgba(255,255,255,0.5)',
                          borderRadius: '50%',
                          transition: 'all 0.2s ease'
                        }}>
                          <i className="bi bi-arrow-right" style={{ fontSize: '16px' }}></i>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Biểu đồ với layout mới */}
          <div className="row g-4 mb-4">
            {/* Biểu đồ doanh thu lớn */}
            <div className="col-12 col-xl-8">
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '25px',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                height: '400px'
              }}>
                <h5 className="fw-bold mb-3 text-primary">
                  <i className="bi bi-graph-up me-2"></i>
                  Xu Hướng Doanh Thu 6 Tháng
                </h5>
                <div style={{ height: '320px' }}>
                  <Line data={areaChartData} options={areaChartOptions} />
                </div>
              </div>
            </div>

            {/* Biểu đồ tròn */}
            <div className="col-12 col-xl-4">
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '25px',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                height: '400px'
              }}>
                <h5 className="fw-bold mb-3 text-success">
                  <i className="bi bi-pie-chart me-2"></i>
                  Tỷ Lệ Doanh Thu
                </h5>
                <div style={{ height: '320px' }}>
                  <Doughnut data={revenueByTypeData} options={pieChartOptions} />
                </div>
              </div>
            </div>
          </div>

          {/* Hàng cuối */}
          <div className="row g-4">
            {/* Biểu đồ cột */}
            <div className="col-12 col-lg-5">
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '25px',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                height: '350px'
              }}>
                <h5 className="fw-bold mb-3 text-warning">
                  <i className="bi bi-bar-chart me-2"></i>
                  Thống Kê Đối Tượng
                </h5>
                <div style={{ height: '270px' }}>
                  <Bar data={countsComparisonData} options={horizontalBarOptions} />
                </div>
              </div>
            </div>

            {/* Bảng thanh toán */}
            <div className="col-12 col-lg-7">
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '25px',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                height: '350px'
              }}>
                <h5 className="fw-bold mb-3 text-info">
                  <i className="bi bi-credit-card me-2"></i>
                  Thanh Toán Gần Đây
                </h5>
                {stats.recentPayments.length === 0 ? (
                  <div className="d-flex align-items-center justify-content-center h-75 text-muted">
                    <div className="text-center">
                      <i className="bi bi-inbox display-1 opacity-50"></i>
                      <p className="mt-3">Không có thanh toán gần đây</p>
                    </div>
                  </div>
                ) : (
                  <div className="table-responsive" style={{ height: '270px', overflowY: 'auto' }}>
                    <table className="table table-hover align-middle">
                      <thead className="table-light sticky-top">
                        <tr>
                          <th className="fw-bold border-0">Căn Hộ</th>
                          <th className="fw-bold border-0">Loại Phí</th>
                          <th className="fw-bold border-0">Số Tiền</th>
                          <th className="fw-bold border-0">Ngày</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentPayments.map((payment, index) => (
                          <tr key={payment._id} style={{
                            transition: 'all 0.2s ease',
                            borderRadius: '10px'
                          }}>
                            <td className="text-primary fw-semibold border-0">
                              <i className="bi bi-building me-2"></i>
                              {payment.household?.apartmentNumber || 'N/A'}
                            </td>
                            <td className="fw-medium border-0">
                              <span className="badge bg-secondary bg-opacity-25 text-dark">
                                {payment.fee?.name || 'N/A'}
                              </span>
                            </td>
                            <td className="text-success fw-bold border-0">
                              {payment.amount.toLocaleString()} VND
                            </td>
                            <td className="text-muted border-0">
                              {new Date(payment.paymentDate).toLocaleDateString('vi-VN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardScreen; 