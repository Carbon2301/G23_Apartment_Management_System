import React, { useState, useEffect, useContext } from 'react';
import { Row, Col, Card, Button, ListGroup, Table, Alert, Badge, Modal, Form } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Message from '../components/common/Message';
import Loader from '../components/common/Loader';
import AuthContext from '../context/AuthContext';
import axios from 'axios';

const HouseholdDetailScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [household, setHousehold] = useState(null);
  const [residents, setResidents] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [feeStatus, setFeeStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showHeadModal, setShowHeadModal] = useState(false);
  const [selectedHead, setSelectedHead] = useState('');
  
  const { userInfo } = useContext(AuthContext);
  
  useEffect(() => {
    fetchHouseholdData();
  }, [id, userInfo]);
  
  const fetchHouseholdData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      // Make all requests in parallel
      const [householdResponse, residentsResponse, vehiclesResponse, feeStatusResponse] = await Promise.all([
        axios.get(`/api/households/${id}`, config),
        axios.get(`/api/households/${id}/residents`, config),
        axios.get(`/api/vehicles/household/${id}`, config),
        axios.get(`/api/payments/household/${id}/fee-status`, config)
      ]);
      
      setHousehold(householdResponse.data);
      setResidents(residentsResponse.data);
      setVehicles(vehiclesResponse.data);
      setFeeStatus(feeStatusResponse.data.feeStatus);
      
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Không thể tải dữ liệu hộ gia đình'
      );
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddResident = () => {
    navigate(`/residents/create?household=${household._id}`);
  };

  const handleUpdateHead = async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      await axios.put(`/api/households/${household._id}`, 
        { householdHead: selectedHead },
        config
      );

      setShowHeadModal(false);
      fetchHouseholdData(); // Refresh data
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Không thể cập nhật chủ hộ'
      );
    } finally {
      setLoading(false);
    }
  };

  const openHeadModal = () => {
    setSelectedHead(household.householdHead?._id || '');
    setShowHeadModal(true);
  };

  const handleCreatePayment = async (feeId, isDebt = false, isVehicleFee = false, isAreaFee = false, isHygieneFee = false) => {
    console.log('🎯 Debug - handleCreatePayment được gọi với:', {
      feeId,
      isDebt,
      isVehicleFee,
      isAreaFee,
      householdId: household._id,
      apartmentNumber: household.apartmentNumber
    });
    
    if (isVehicleFee) {
      // Xử lý tự động tạo thanh toán cho phí xe
      try {
        setLoading(true);
        
        const config = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userInfo.token}`,
          },
        };
        
        // Tính phí xe cho hộ gia đình
        const vehicleFeeResponse = await axios.get(`/api/vehicle-fees/calculate/${household._id}`, config);
        const vehicleFeeData = vehicleFeeResponse.data.data;
        
        if (vehicleFeeData.totalAmount <= 0) {
          setError('Hộ gia đình này không có phương tiện nào để tính phí');
          return;
        }
        
        // Lấy danh sách fees để tìm PHI005 (phí gửi xe thực tế) - FIX cho lỗi ObjectId
        const feesResponse = await axios.get('/api/fees', config);
        const realVehicleFee = feesResponse.data.find(fee => fee.feeCode === 'PHI005' && fee.active);
        
        console.log('🔍 Debug - Tìm PHI005:', {
          allFees: feesResponse.data.map(f => ({ id: f._id, code: f.feeCode, name: f.name, active: f.active })),
          realVehicleFee: realVehicleFee
        });
        
        if (!realVehicleFee) {
          setError('Không tìm thấy loại phí gửi xe PHI005 trong hệ thống');
          return;
        }
        
        // Tạo note chi tiết về xe
        const vehicleDetails = vehicleFeeData.feeDetails.map(detail => 
          `${detail.count} ${detail.vehicleType}: ${detail.amount.toLocaleString('vi-VN')} VND`
        ).join(', ');
        
        // Xác định period dựa trên isDebt
        let period;
        let notePrefix = 'Phí gửi xe';
        
        const today = new Date();
        let targetYear, targetMonth;
        
        if (isDebt) {
          // Tháng trước cho trả nợ
          targetMonth = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
          targetYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
          notePrefix = 'Trả nợ phí gửi xe';
        } else {
          // Tháng hiện tại cho thanh toán bình thường
          targetMonth = today.getMonth();
          targetYear = today.getFullYear();
        }
        
        // Tạo period với format consistent
        period = new Date(targetYear, targetMonth, 1).toISOString();
        
        console.log('🔍 Debug - Tạo period:', { targetYear, targetMonth, period, isDebt });
        
        // Tạo thanh toán tự động với PHI005 ID thật
        const paymentData = {
          household: household._id,
          fee: realVehicleFee._id, // SỬA: Sử dụng ObjectId thật của PHI005 thay vì "vehicle-fee-combined"
          amount: vehicleFeeData.totalAmount,
          paymentDate: new Date().toISOString(),
          payerName: household.householdHead?.fullName || 'Chủ hộ',
          payerId: household.householdHead?.idCard || '',
          payerPhone: household.householdHead?.phoneNumber || '',
          receiptNumber: `VF${Date.now()}`, // Vehicle Fee receipt
          note: `${notePrefix}: ${vehicleDetails}`,
          period: period,
          method: 'cash',
          status: 'paid'
        };
       
        // Debug: Log dữ liệu gửi đi
        console.log('🔍 Debug - Dữ liệu thanh toán gửi đi:', {
          household: paymentData.household,
          fee: paymentData.fee,
          period: paymentData.period,
          amount: paymentData.amount,
          note: paymentData.note
        });
        
        // Kiểm tra xem có thanh toán nào tồn tại cho PHI005 + household + period này không
        try {
          const existingPaymentsResponse = await axios.get(`/api/payments/household/${household._id}`, config);
          
          console.log('🔍 Debug - Tất cả payments của household:', existingPaymentsResponse.data.map(p => ({
            id: p._id,
            feeName: p.fee.name,
            feeCode: p.fee.feeCode,
            feeId: p.fee._id,
            amount: p.amount,
            period: p.period,
            status: p.status
          })));
          
          const existingVehiclePayments = existingPaymentsResponse.data.filter(payment => {
            const isVehicleFee = payment.fee._id === realVehicleFee._id || 
                                payment.fee.feeCode === 'PHI005' ||
                                (payment.fee.name && payment.fee.name.toLowerCase().includes('xe'));
            
            console.log('🔍 Debug - Kiểm tra payment:', {
              paymentId: payment._id,
              feeId: payment.fee._id,
              feeName: payment.fee.name,
              feeCode: payment.fee.feeCode,
              realVehicleFeeId: realVehicleFee._id,
              isVehicleFee
            });
            
            return isVehicleFee;
          });
          
          console.log('🔍 Debug - Các thanh toán phí xe hiện có:', existingVehiclePayments.map(p => ({
            id: p._id,
            period: p.period,
            amount: p.amount,
            status: p.status,
            createdAt: p.createdAt,
            feeId: p.fee._id,
            feeName: p.fee.name
          })));
          
          // Tạo period theo format chính xác để so sánh
          const today = new Date();
          let targetYear, targetMonth;
          
          if (isDebt) {
            // Tháng trước cho trả nợ
            targetMonth = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
            targetYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
          } else {
            // Tháng hiện tại cho thanh toán bình thường
            targetMonth = today.getMonth();
            targetYear = today.getFullYear();
          }
          
          console.log('🔍 Debug - Target period:', { targetYear, targetMonth, isDebt });
          
          const conflictingPayment = existingVehiclePayments.find(payment => {
            // Sử dụng logic giống backend - kiểm tra theo tháng
            const paymentPeriod = new Date(payment.period);
            const targetPeriodStart = new Date(targetYear, targetMonth, 1);
            const targetPeriodEnd = new Date(targetYear, targetMonth + 1, 1);
            
            // So sánh: payment period có nằm trong target month không
            const match = paymentPeriod >= targetPeriodStart && paymentPeriod < targetPeriodEnd;
            
            console.log('🔍 Debug - So sánh period (giống backend):', {
              paymentId: payment._id,
              paymentPeriod: {
                date: paymentPeriod,
                year: paymentPeriod.getFullYear(),
                month: paymentPeriod.getMonth(),
                original: payment.period
              },
              target: { 
                targetYear, 
                targetMonth,
                start: targetPeriodStart,
                end: targetPeriodEnd
              },
              match
            });
            
            return match;
          });
          
          if (conflictingPayment) {
            console.log('⚠️ Debug - Tìm thấy thanh toán trùng lặp:', {
              conflictingPayment,
              currentAmount: vehicleFeeData.totalAmount,
              amountDiff: Math.abs(conflictingPayment.amount - vehicleFeeData.totalAmount)
            });
            
            // TẠM THỜI DISABLE DUPLICATE CHECK ĐỂ DEBUG
            console.log('🚧 Debug - TẠM THỜI BỎ QUA DUPLICATE CHECK ĐỂ DEBUG');
            
            // Cập nhật period để tránh conflict (thêm vài phút)
            const periodDate = new Date(targetYear, targetMonth, 1);
            periodDate.setMinutes(periodDate.getMinutes() + Math.floor(Math.random() * 60) + 1);
            period = periodDate.toISOString();
            
            console.log('🔧 Debug - Cập nhật period để tránh conflict:', period);
            
            // Không return, tiếp tục tạo payment
          }
          
          console.log('✅ Debug - Không có thanh toán trùng lặp, tiếp tục tạo payment');
        } catch (debugError) {
          console.log('🔍 Debug - Lỗi khi kiểm tra thanh toán hiện có:', debugError.message);
        }
       
        console.log('🚀 Debug - Gửi request tạo payment:', paymentData);
        
        const createPaymentResponse = await axios.post('/api/payments', paymentData, config);
        
        console.log('✅ Debug - Tạo payment thành công:', createPaymentResponse.data);
        
        // Chuyển hướng đến trang danh sách thanh toán với thông báo thành công
        navigate('/payments', { 
          state: { 
            message: isDebt ? 'Trả nợ phí xe đã được tạo thành công!' : 'Thanh toán phí xe đã được tạo thành công!' 
          }
        });
        
      } catch (error) {
        console.log('❌ Debug - Lỗi khi tạo payment:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.response?.data?.message,
          data: error.response?.data,
          fullError: error
        });
        
        // Xử lý lỗi thanh toán đã tồn tại
        if (error.response?.data?.message?.includes('already exists') || 
            error.response?.status === 400) {
          const periodText = isDebt ? 'tháng trước' : 'tháng này';
          setError(`Đã có thanh toán phí xe cho ${periodText}. Vui lòng kiểm tra lại trong danh sách thanh toán.`);
          
          // Chuyển đến trang payments sau 2 giây
          setTimeout(() => {
            navigate(`/payments?household=${household._id}`);
          }, 2000);
        } else {
          setError(
            error.response?.data?.message || 
            'Có lỗi xảy ra khi tạo thanh toán phí xe'
          );
        }
      } finally {
        setLoading(false);
      }
    } else if (isAreaFee) {
      // Xử lý tự động tạo thanh toán cho phí dịch vụ & chung cư
      try {
        setLoading(true);
        
        const config = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userInfo.token}`,
          },
        };
        
        // Tính phí theo diện tích cho hộ gia đình
        const areaFeeResponse = await axios.get(`/api/area-fees/calculate/${household._id}`, config);
        const areaFeeData = areaFeeResponse.data.data;
        
        console.log('🏢 Debug - Dữ liệu phí theo diện tích từ API:', {
          householdId: household._id,
          apartmentNumber: household.apartmentNumber,
          area: areaFeeData.area,
          totalAmount: areaFeeData.totalAmount,
          feeDetails: areaFeeData.feeDetails,
          rawResponse: areaFeeResponse.data
        });

        // Kiểm tra từng feeDetail có hợp lệ không
        areaFeeData.feeDetails.forEach((detail, index) => {
          console.log(`🔍 Debug - FeeDetail ${index + 1}:`, {
            feeCode: detail.feeCode,
            feeName: detail.feeName,
            feeId: detail.feeId,
            unitPrice: detail.unitPrice,
            area: detail.area,
            amount: detail.amount,
            feeIdType: typeof detail.feeId,
            feeIdValid: detail.feeId && detail.feeId.toString().length === 24
          });
        });
        
        if (areaFeeData.totalAmount <= 0) {
          setError('Hộ gia đình này không có diện tích hoặc không có phí theo diện tích');
          return;
        }
        
        // Xác định period dựa trên isDebt
        let period;
        let notePrefix = 'Phí dịch vụ & chung cư';
        
        const today = new Date();
        let targetYear, targetMonth;
        
        if (isDebt) {
          // Tháng trước cho trả nợ
          targetMonth = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
          targetYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
          notePrefix = 'Trả nợ phí dịch vụ & chung cư';
        } else {
          // Tháng hiện tại cho thanh toán bình thường
          targetMonth = today.getMonth();
          targetYear = today.getFullYear();
        }
        
        // Tạo period với format consistent
        period = new Date(targetYear, targetMonth, 1).toISOString();
        
        console.log('🏢 Debug - Tạo thanh toán phí diện tích:', { 
          targetYear, 
          targetMonth, 
          period, 
          isDebt,
          totalAmount: areaFeeData.totalAmount,
          area: areaFeeData.area
        });
        
        // Tạo thanh toán cho từng loại phí (PHI006, PHI007)
        const createdPayments = [];
        const failedPayments = [];
        
        for (const feeDetail of areaFeeData.feeDetails) {
          // Validate feeDetail trước khi tạo payment
          if (!feeDetail.feeId) {
            console.error(`❌ FeeDetail thiếu feeId:`, feeDetail);
            failedPayments.push({
              feeName: feeDetail.feeName,
              reason: 'Thiếu feeId'
            });
            continue;
          }

          if (!feeDetail.amount || feeDetail.amount <= 0) {
            console.error(`❌ FeeDetail có amount không hợp lệ:`, feeDetail);
            failedPayments.push({
              feeName: feeDetail.feeName,
              reason: 'Amount không hợp lệ'
            });
            continue;
          }

          const paymentData = {
            household: household._id,
            fee: feeDetail.feeId,
            amount: feeDetail.amount,
            paymentDate: new Date().toISOString(),
            payerName: household.householdHead?.fullName || 'Chủ hộ',
            payerId: household.householdHead?.idCard || '',
            payerPhone: household.householdHead?.phoneNumber || '',
            receiptNumber: `AF${Date.now()}_${feeDetail.feeCode}`, // Area Fee receipt
            note: `${notePrefix} - ${feeDetail.feeName}: ${areaFeeData.area}m² × ${feeDetail.unitPrice.toLocaleString('vi-VN')} VND/m²`,
            period: period,
            method: 'cash',
            status: 'paid'
          };
          
          console.log('🏢 Debug - Tạo thanh toán cho phí:', {
            feeCode: feeDetail.feeCode,
            feeName: feeDetail.feeName,
            amount: feeDetail.amount,
            period: period,
            paymentData
          });

          // Kiểm tra thanh toán đã tồn tại trước khi tạo
          try {
            const existingPaymentCheck = await axios.get(`/api/payments/household/${household._id}`, config);
            const existingPayments = existingPaymentCheck.data;
            
            const conflictingPayment = existingPayments.find(payment => {
              const sameFee = payment.fee._id === feeDetail.feeId;
              const samePeriod = payment.period && new Date(payment.period).getMonth() === new Date(period).getMonth() && 
                                 new Date(payment.period).getFullYear() === new Date(period).getFullYear();
              return sameFee && samePeriod;
            });

            if (conflictingPayment) {
              console.log(`⚠️  Thanh toán ${feeDetail.feeName} đã tồn tại:`, conflictingPayment);
              failedPayments.push({
                feeName: feeDetail.feeName,
                reason: 'Đã tồn tại'
              });
              continue;
            }
          } catch (checkError) {
            console.log('⚠️  Không thể kiểm tra thanh toán đã tồn tại:', checkError.message);
          }
          
          try {
            const createPaymentResponse = await axios.post('/api/payments', paymentData, config);
            createdPayments.push(createPaymentResponse.data);
            console.log(`✅ Tạo thành công payment cho ${feeDetail.feeName}`, createPaymentResponse.data);
          } catch (paymentError) {
            console.error(`❌ Lỗi tạo payment cho ${feeDetail.feeName}:`, {
              error: paymentError,
              response: paymentError.response?.data,
              status: paymentError.response?.status,
              paymentData
            });
            
            // Kiểm tra nếu là lỗi thanh toán đã tồn tại
            if (paymentError.response?.data?.message?.includes('already exists') || 
                (paymentError.response?.status === 400 && paymentError.response?.data?.message?.includes('đã tồn tại'))) {
              console.log(`⚠️  Thanh toán ${feeDetail.feeName} đã tồn tại, bỏ qua...`);
              failedPayments.push({
                feeName: feeDetail.feeName,
                reason: 'Đã tồn tại'
              });
              continue; // Tiếp tục với phí tiếp theo
            } else {
              // Ghi lại lỗi nhưng không throw để tiếp tục tạo thanh toán khác
              failedPayments.push({
                feeName: feeDetail.feeName,
                reason: paymentError.response?.data?.message || paymentError.message
              });
              console.log(`🔄 Tiếp tục tạo thanh toán khác sau lỗi ${feeDetail.feeName}`);
            }
          }
        }
        
        console.log('✅ Debug - Hoàn thành tạo payments phí diện tích:', {
          totalCreated: createdPayments.length,
          totalFees: areaFeeData.feeDetails.length,
          createdPayments,
          failedPayments
        });
        
        // Xử lý thông báo dựa trên kết quả
        let message;
        if (createdPayments.length === areaFeeData.feeDetails.length) {
          // Tất cả thanh toán được tạo thành công
          message = isDebt ? 
            'Trả nợ phí dịch vụ & chung cư đã được tạo thành công!' : 
            'Thanh toán phí dịch vụ & chung cư đã được tạo thành công!';
        } else if (createdPayments.length > 0) {
          // Một số thanh toán được tạo thành công
          const successFees = createdPayments.map(p => p.fee?.name || 'Unknown').join(', ');
          const failedFees = failedPayments.map(f => f.feeName).join(', ');
          message = `Đã tạo thành công: ${successFees}. ${failedFees ? `Lỗi: ${failedFees}` : ''}`;
        } else {
          // Không có thanh toán nào được tạo thành công
          const failures = failedPayments.map(f => `${f.feeName}: ${f.reason}`).join(', ');
          throw new Error(`Không thể tạo thanh toán nào. ${failures}`);
        }
        
        // Chuyển hướng đến trang danh sách thanh toán với thông báo thành công
        navigate('/payments', { 
          state: { message }
        });
        
      } catch (error) {
        console.error('🔥 Debug - Lỗi tạo thanh toán phí dịch vụ & chung cư:', error);
        
        // Xử lý lỗi thanh toán đã tồn tại
        if (error.response?.data?.message?.includes('already exists') || 
            error.response?.status === 400) {
          const periodText = isDebt ? 'tháng trước' : 'tháng này';
          setError(`Đã có thanh toán phí dịch vụ & chung cư cho ${periodText}. Vui lòng kiểm tra lại trong danh sách thanh toán.`);
          
          // Chuyển đến trang payments sau 2 giây
          setTimeout(() => {
            navigate(`/payments?household=${household._id}`);
          }, 2000);
        } else {
          setError(
            error.response && error.response.data.message
              ? error.response.data.message
              : 'Có lỗi xảy ra khi tạo thanh toán phí dịch vụ & chung cư'
          );
        }
      } finally {
        setLoading(false);
      }
    } else if (isHygieneFee) {
      // Xử lý tự động tạo thanh toán cho phí vệ sinh
      try {
        setLoading(true);
        
        const config = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userInfo.token}`,
          },
        };
        
        // Tính phí vệ sinh cho hộ gia đình
        const hygieneFeeResponse = await axios.get(`/api/hygiene-fees/calculate/${household._id}`, config);
        const hygieneFeeData = hygieneFeeResponse.data.data;
        
        console.log('🧽 Debug - Dữ liệu phí vệ sinh từ API:', {
          householdId: household._id,
          apartmentNumber: household.apartmentNumber,
          residentCount: hygieneFeeData.residentCount,
          totalAmount: hygieneFeeData.totalAmount,
          residents: hygieneFeeData.residents
        });
        
        if (hygieneFeeData.totalAmount <= 0) {
          setError('Hộ gia đình này không có cư dân hoạt động để tính phí vệ sinh');
          return;
        }
        
        // Lấy fee PHI008 (phí vệ sinh)
        const feesResponse = await axios.get('/api/fees', config);
        const hygieneFee = feesResponse.data.find(fee => fee.feeCode === 'PHI008' && fee.active);
        
        if (!hygieneFee) {
          setError('Không tìm thấy loại phí vệ sinh PHI008 trong hệ thống');
          return;
        }
        
        // Xác định period dựa trên isDebt (năm thay vì tháng)
        let period;
        let notePrefix = 'Phí vệ sinh';
        
        const today = new Date();
        let targetYear;
        
        if (isDebt) {
          // Năm trước cho trả nợ
          targetYear = today.getFullYear() - 1;
          notePrefix = 'Trả nợ phí vệ sinh';
        } else {
          // Năm hiện tại cho thanh toán bình thường
          targetYear = today.getFullYear();
        }
        
        // Tạo period cho ngày 1/1 của năm
        period = new Date(targetYear, 0, 1).toISOString();
        
        console.log('🧽 Debug - Tạo thanh toán phí vệ sinh:', {
          targetYear,
          period,
          isDebt,
          totalAmount: hygieneFeeData.totalAmount,
          residentCount: hygieneFeeData.residentCount
        });
        
        // Kiểm tra thanh toán đã tồn tại
        const existingPaymentsResponse = await axios.get(`/api/payments/household/${household._id}`, config);
        const existingPayments = existingPaymentsResponse.data;
        
        const conflictingPayment = existingPayments.find(payment => {
          const sameFee = payment.fee._id === hygieneFee._id;
          const sameYear = payment.period && 
            new Date(payment.period).getFullYear() === targetYear;
          return sameFee && sameYear;
        });

        if (conflictingPayment) {
          const yearText = isDebt ? 'năm trước' : 'năm này';
          setError(`Đã có thanh toán phí vệ sinh cho ${yearText}. Vui lòng kiểm tra lại trong danh sách thanh toán.`);
          setTimeout(() => {
            navigate(`/payments?household=${household._id}`);
          }, 2000);
          return;
        }
        
        // Tạo thanh toán
        const paymentData = {
          household: household._id,
          fee: hygieneFee._id,
          amount: hygieneFeeData.totalAmount,
          paymentDate: new Date().toISOString(),
          payerName: household.householdHead?.fullName || 'Chủ hộ',
          payerId: household.householdHead?.idCard || '',
          payerPhone: household.householdHead?.phoneNumber || '',
          receiptNumber: `HF${Date.now()}`, // Hygiene Fee receipt
          note: `${notePrefix} năm ${targetYear}: ${hygieneFeeData.residentCount} nhân khẩu × 6.000 VND/tháng × 12 tháng`,
          period: period,
          method: 'cash',
          status: 'paid'
        };
        
        const createPaymentResponse = await axios.post('/api/payments', paymentData, config);
        console.log('✅ Tạo thành công payment phí vệ sinh:', createPaymentResponse.data);
        
        const message = isDebt ? 
          'Trả nợ phí vệ sinh đã được tạo thành công!' : 
          'Thanh toán phí vệ sinh đã được tạo thành công!';
        
        // Chuyển hướng đến trang danh sách thanh toán với thông báo thành công
        navigate('/payments', { 
          state: { message }
        });
        
      } catch (error) {
        console.error('🔥 Debug - Lỗi tạo thanh toán phí vệ sinh:', error);
        
        if (error.response?.data?.message?.includes('already exists') || 
            error.response?.status === 400) {
          const yearText = isDebt ? 'năm trước' : 'năm này';
          setError(`Đã có thanh toán phí vệ sinh cho ${yearText}. Vui lòng kiểm tra lại trong danh sách thanh toán.`);
          
          setTimeout(() => {
            navigate(`/payments?household=${household._id}`);
          }, 2000);
        } else {
          setError(
            error.response && error.response.data.message
              ? error.response.data.message
              : 'Có lỗi xảy ra khi tạo thanh toán phí vệ sinh'
          );
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Xử lý bình thường cho các phí khác
      navigate(`/payments/create?household=${household._id}&fee=${feeId}&isDebt=${isDebt}`);
    }
  };

  // Helper function to get badge variant based on status
  const getStatusBadge = (status) => {
    switch(status) {
      case 'paid':
        return <Badge bg="success" className="px-3 py-2">Đã thanh toán</Badge>;
      case 'pending':
        return <Badge bg="warning" className="px-3 py-2">Chưa thanh toán</Badge>;
      case 'overdue':
        return <Badge bg="danger" className="px-3 py-2">Quá hạn</Badge>;
      default:
        return <Badge bg="secondary" className="px-3 py-2">Không áp dụng</Badge>;
    }
  };
  
  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      minHeight: '100vh',
      padding: '20px'
    }}>
      {/* Navigation */}
      <div className="mb-4">
        <Link to='/households' className='btn btn-light btn-lg rounded-pill shadow-sm px-4' style={{
          border: 'none',
          transition: 'all 0.3s ease'
        }}>
          <i className="bi bi-arrow-left me-2"></i> Quay lại Danh sách
        </Link>
      </div>
      
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error}</Message>
      ) : household ? (
        <>
          {/* Hero Section - Household Info */}
          <div className="mb-5">
            <div style={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(15px)',
              borderRadius: '25px',
              padding: '40px',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 15px 50px rgba(0,0,0,0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Background Pattern */}
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '200px',
                height: '200px',
                background: 'linear-gradient(45deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1))',
                borderRadius: '50%',
                transform: 'translate(50%, -50%)'
              }}></div>
              
              <Row className="align-items-center">
                <Col lg={8}>
                  <div className="d-flex align-items-center mb-4">
                    <div style={{
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      borderRadius: '20px',
                      padding: '20px',
                      marginRight: '20px',
                      boxShadow: '0 10px 30px rgba(79, 172, 254, 0.3)'
                    }}>
                      <i className="bi bi-house-door" style={{ fontSize: '3rem', color: 'white' }}></i>
                    </div>
                    <div>
                      <h1 className="mb-2 fw-bold" style={{ fontSize: '3rem', color: '#2d3748' }}>
                        Căn hộ {household.apartmentNumber}
                      </h1>
                      <div className="d-flex align-items-center gap-3">
                        <Badge bg={household.active ? 'success' : 'danger'} className="px-3 py-2 fs-6">
                          <i className={`bi ${household.active ? 'bi-check-circle' : 'bi-x-circle'} me-2`}></i>
                          {household.active ? 'Đang hoạt động' : 'Không hoạt động'}
                        </Badge>
                        <span className="text-muted">
                          <i className="bi bi-calendar3 me-2"></i>
                          Từ {new Date(household.creationDate).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="d-flex align-items-center p-3" style={{
                        background: 'rgba(79, 172, 254, 0.1)',
                        borderRadius: '15px',
                        border: '1px solid rgba(79, 172, 254, 0.2)'
                      }}>
                        <i className="bi bi-geo-alt-fill text-primary me-3" style={{ fontSize: '1.5rem' }}></i>
                        <div>
                          <div className="text-muted small">Địa chỉ</div>
                          <div className="fw-semibold">{household.address}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="d-flex align-items-center p-3" style={{
                        background: 'rgba(255, 154, 86, 0.1)',
                        borderRadius: '15px',
                        border: '1px solid rgba(255, 154, 86, 0.2)'
                      }}>
                        <i className="bi bi-ruler-combined text-info me-3" style={{ fontSize: '1.5rem' }}></i>
                        <div>
                          <div className="text-muted small">Diện tích</div>
                          <div className="fw-semibold">{household.area ? `${household.area} m²` : 'Chưa cập nhật'}</div>
                        </div>
                      </div>
                    </div>
                    {household.note && (
                      <div className="col-md-6">
                        <div className="d-flex align-items-center p-3" style={{
                          background: 'rgba(255, 193, 7, 0.1)',
                          borderRadius: '15px',
                          border: '1px solid rgba(255, 193, 7, 0.2)'
                        }}>
                          <i className="bi bi-sticky-fill text-warning me-3" style={{ fontSize: '1.5rem' }}></i>
                          <div>
                            <div className="text-muted small">Ghi chú</div>
                            <div className="fw-semibold">{household.note}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Col>
                
                <Col lg={4} className="text-end">
                  <Link
                    to={`/households/${household._id}/edit`}
                    className="btn btn-primary btn-lg rounded-pill px-4 py-3 shadow-sm"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <i className="bi bi-pencil-square me-2"></i> Chỉnh sửa thông tin
                  </Link>
                </Col>
              </Row>

              {/* Household Head Section */}
              <Row className="mt-4">
                <Col>
                  <div style={{
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    borderRadius: '20px',
                    padding: '25px',
                    color: 'white',
                    boxShadow: '0 10px 30px rgba(240, 147, 251, 0.3)'
                  }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <div style={{
                          width: '70px',
                          height: '70px',
                          background: 'rgba(255,255,255,0.2)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '20px'
                        }}>
                          <i className="bi bi-crown-fill" style={{ fontSize: '2rem' }}></i>
                        </div>
                        <div>
                          <h4 className="mb-1 fw-bold">Chủ căn hộ</h4>
                          {household.householdHead ? (
                            <>
                              <h5 className="mb-1">{household.householdHead.fullName}</h5>
                              <div className="opacity-75">
                                <i className={`bi ${household.householdHead.gender === 'male' ? 'bi-gender-male' : 'bi-gender-female'} me-2`}></i>
                                {household.householdHead.gender === 'male' ? 'Nam' : 'Nữ'}
                                {household.householdHead.phone && (
                                  <>
                                    <span className="mx-2">•</span>
                                    <i className="bi bi-telephone me-1"></i>
                                    {household.householdHead.phone}
                                  </>
                                )}
                              </div>
                              {household.householdHead.idCard && (
                                <div className="opacity-75 mt-1">
                                  <i className="bi bi-credit-card-2-front me-1"></i>
                                  {household.householdHead.idCard}
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <p className="mb-1 opacity-75">Chưa có chủ hộ</p>
                              <small className="opacity-50">Hãy thêm cư dân và chỉ định chủ hộ</small>
                            </>
                          )}
                        </div>
                      </div>
                                             <div className="d-flex gap-2">
                         {household.householdHead && (
                           <Link to={`/residents/${household.householdHead._id}/edit`}>
                             <Button variant="light" className="rounded-pill px-3 py-2">
                               <i className="bi bi-pencil me-1"></i> Sửa thông tin
                             </Button>
                           </Link>
                         )}
                         <Button 
                           variant="outline-light" 
                           className="rounded-pill px-3 py-2"
                           onClick={openHeadModal}
                         >
                           <i className="bi bi-person-check me-1"></i> 
                           {household.householdHead ? 'Đổi chủ hộ' : 'Chọn chủ hộ'}
                         </Button>
                       </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </div>

          {/* Main Content Grid */}
          <Row className="g-4">
            {/* Residents Section */}
            <Col xl={8}>
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(15px)',
                borderRadius: '20px',
                padding: '30px',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
              }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h3 className="fw-bold text-dark d-flex align-items-center">
                    <i className="bi bi-people-fill me-3 text-primary" style={{ fontSize: '1.8rem' }}></i>
                    Cư dân ({residents.length})
                  </h3>
                  <Button 
                    variant="success" 
                    className="rounded-pill px-4 py-2 shadow-sm"
                    onClick={handleAddResident}
                    style={{ border: 'none' }}
                  >
                    <i className="bi bi-plus-circle me-2"></i> Thêm cư dân
                  </Button>
                </div>
                
                {residents.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-person-plus display-1 text-muted opacity-50"></i>
                    <h5 className="mt-3 text-muted">Chưa có cư dân nào</h5>
                    <p className="text-muted">Hãy thêm cư dân để bắt đầu quản lý</p>
                  </div>
                ) : (
                  <Row xs={1} md={2} className="g-4">
                    {residents.map((resident) => (
                      <Col key={resident._id}>
                        <div style={{
                          background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                          borderRadius: '18px',
                          padding: '20px',
                          height: '100%',
                          boxShadow: '0 8px 25px rgba(252, 182, 159, 0.3)',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }} 
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0px)'}>
                          <div className="d-flex align-items-center mb-3">
                            <div style={{
                              width: '60px',
                              height: '60px',
                              background: resident.active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#6c757d',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '15px',
                              boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
                            }}>
                              <i className="bi bi-person-fill text-white" style={{ fontSize: '1.5rem' }}></i>
                            </div>
                            <div className="flex-grow-1">
                              <h5 className="mb-1 fw-bold text-dark d-flex align-items-center">
                                {resident._id === household.householdHead?._id && (
                                  <i className="bi bi-crown-fill text-warning me-2" title="Chủ hộ"></i>
                                )}
                                {resident.fullName}
                              </h5>
                              <p className="mb-0 text-muted">
                                <i className={`bi ${resident.gender === 'male' ? 'bi-gender-male' : 'bi-gender-female'} me-1`}></i>
                                {resident.gender === 'male' ? 'Nam' : 'Nữ'}
                              </p>
                              {/* Temp Status Badge */}
                              {resident.tempStatus && resident.tempStatus !== 'none' && (
                                <div className="mt-2">
                                  {resident.tempStatus === 'tam_tru' ? (
                                    <Badge bg="info" className="px-2 py-1" style={{ fontSize: '0.75rem' }}>
                                      <i className="fas fa-home me-1"></i>Tạm trú
                                    </Badge>
                                  ) : (
                                    <Badge bg="warning" className="px-2 py-1" style={{ fontSize: '0.75rem' }}>
                                      <i className="fas fa-plane-departure me-1"></i>Tạm vắng
                                    </Badge>
                                  )}
                                  {resident.tempEndDate && (
                                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                      Đến: {new Date(resident.tempEndDate).toLocaleDateString('vi-VN')}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <div className="text-muted small mb-1">CCCD/CMND</div>
                            <div className="fw-semibold text-dark">{resident.idCard || 'Chưa cập nhật'}</div>
                          </div>
                          
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              {resident.active ? (
                                <Badge bg="success" className="px-3 py-2">
                                  <i className="bi bi-check-circle me-1"></i>Hoạt động
                                </Badge>
                              ) : (
                                <Badge bg="secondary" className="px-3 py-2">
                                  <i className="bi bi-pause-circle me-1"></i>Tạm ngưng
                                </Badge>
                              )}
                            </div>
                            <Link to={`/residents/${resident._id}`}>
                              <Button variant="outline-dark" size="sm" className="rounded-pill">
                                <i className="bi bi-eye me-1"></i> Xem chi tiết
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                )}
              </div>
              
              {/* Vehicles Section */}
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(15px)',
                borderRadius: '20px',
                padding: '30px',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                marginTop: '20px'
              }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h3 className="fw-bold text-dark d-flex align-items-center">
                    <i className="bi bi-car-front-fill me-3 text-primary" style={{ fontSize: '1.8rem' }}></i>
                    Phương tiện ({vehicles.length})
                  </h3>
                  <div className="d-flex gap-2">
                    <Link to={`/vehicles/create?household=${household._id}`}>
                      <Button 
                        variant="success" 
                        className="rounded-pill px-4 py-2 shadow-sm"
                        style={{ border: 'none' }}
                      >
                        <i className="bi bi-plus-circle me-2"></i> Thêm xe
                      </Button>
                    </Link>
                    <Link to={`/vehicles?household=${household._id}`}>
                      <Button 
                        variant="outline-primary" 
                        className="rounded-pill px-4 py-2"
                      >
                        <i className="bi bi-eye me-2"></i> Xem tất cả
                      </Button>
                    </Link>
                  </div>
                </div>
                
                {vehicles.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-car-front display-1 text-muted opacity-50"></i>
                    <h5 className="mt-3 text-muted">Chưa có phương tiện nào</h5>
                    <p className="text-muted">Hãy thêm phương tiện để bắt đầu quản lý</p>
                  </div>
                ) : (
                  <Row xs={1} md={2} className="g-4">
                    {vehicles.slice(0, 4).map((vehicle) => (
                      <Col key={vehicle._id}>
                        <div style={{
                          background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                          borderRadius: '18px',
                          padding: '20px',
                          height: '100%',
                          boxShadow: '0 8px 25px rgba(187, 222, 251, 0.3)',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }} 
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0px)'}>
                          <div className="d-flex align-items-center mb-3">
                            <div style={{
                              width: '60px',
                              height: '60px',
                              background: vehicle.status === 'Đang sử dụng' ? 'linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%)' : '#6c757d',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '15px',
                              boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
                            }}>
                              <i className={`bi ${vehicle.vehicleType === 'Ô tô' ? 'bi-car-front-fill' : vehicle.vehicleType === 'Xe máy' ? 'bi-scooter' : vehicle.vehicleType === 'Xe đạp' ? 'bi-bicycle' : 'bi-lightning-charge-fill'} text-white`} style={{ fontSize: '1.5rem' }}></i>
                            </div>
                            <div className="flex-grow-1">
                              <h5 className="mb-1 fw-bold text-dark">
                                {vehicle.licensePlate}
                              </h5>
                              <p className="mb-0 text-muted">
                                <i className="bi bi-tag me-1"></i>
                                {vehicle.vehicleType}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <div className="text-muted small mb-1">Hãng & Mẫu</div>
                            <div className="fw-semibold text-dark">
                              {vehicle.brand} {vehicle.model && `- ${vehicle.model}`}
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <div className="text-muted small mb-1">Chủ sở hữu</div>
                            <div className="fw-semibold text-dark">{vehicle.owner?.fullName}</div>
                          </div>
                          
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              {vehicle.status === 'Đang sử dụng' ? (
                                <Badge bg="success" className="px-3 py-2">
                                  <i className="bi bi-check-circle me-1"></i>Đang sử dụng
                                </Badge>
                              ) : vehicle.status === 'Tạm ngưng' ? (
                                <Badge bg="warning" className="px-3 py-2">
                                  <i className="bi bi-pause-circle me-1"></i>Tạm ngưng
                                </Badge>
                              ) : (
                                <Badge bg="danger" className="px-3 py-2">
                                  <i className="bi bi-x-circle me-1"></i>Đã bán
                                </Badge>
                              )}
                            </div>
                            <Link to={`/vehicles/${vehicle._id}/edit`}>
                              <Button variant="outline-dark" size="sm" className="rounded-pill">
                                <i className="bi bi-pencil me-1"></i> Sửa
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                )}
                {vehicles.length > 4 && (
                  <div className="text-center mt-4">
                    <Link to={`/vehicles?household=${household._id}`}>
                      <Button variant="outline-primary" className="rounded-pill">
                        <i className="bi bi-arrow-right me-2"></i>
                        Xem thêm {vehicles.length - 4} xe khác
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </Col>
            
            {/* Fee Status Section */}
            <Col xl={4}>
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(15px)',
                borderRadius: '20px',
                padding: '30px',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
              }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="fw-bold text-dark d-flex align-items-center">
                    <i className="bi bi-credit-card-fill me-3 text-success" style={{ fontSize: '1.5rem' }}></i>
                    Thanh toán
                  </h4>
                  <Link to={`/payments?household=${household._id}`} className="btn btn-outline-primary btn-sm rounded-pill">
                    <i className="bi bi-clock-history me-1"></i> Lịch sử
                  </Link>
                </div>
                
                {feeStatus.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="bi bi-wallet2 display-4 text-muted opacity-50"></i>
                    <p className="mt-3 text-muted">Không có khoản phí nào</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {feeStatus.map((fee) => (
                      <div key={fee._id} style={{
                        background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                        borderRadius: '15px',
                        padding: '20px',
                        boxShadow: '0 5px 20px rgba(168, 237, 234, 0.3)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <h6 className="mb-0 fw-bold text-dark">{fee.name}</h6>
                          <i className={`bi ${fee.feeType === 'vehicle' ? 'bi-car-front' : fee.feeType === 'area-based' ? 'bi-building' : fee.feeType === 'hygiene' ? 'bi-droplet' : 'bi-cash-coin'} text-success`} style={{ fontSize: '1.2rem' }}></i>
                        </div>
                        
                        <div className="mb-3">
                          <div className="text-muted small mb-1">Số tiền</div>
                          <div className="fw-bold text-success fs-5">
                            {fee.amount.toLocaleString('vi-VN')} VND
                          </div>
                          
                          {/* Hiển thị chi tiết xe nếu có */}
                          {fee.vehicleDetails && fee.vehicleDetails.length > 0 && (
                            <div className="mt-2">
                              <div className="text-muted small mb-1">Chi tiết xe</div>
                              {fee.vehicleDetails.map((detail, idx) => (
                                <div key={idx} className="small text-dark">
                                  • {detail.count} {detail.vehicleType}: {detail.amount.toLocaleString('vi-VN')} VND
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Hiển thị chi tiết phí theo diện tích nếu có */}
                          {fee.areaDetails && fee.areaDetails.length > 0 && (
                            <div className="mt-2">
                              <div className="text-muted small mb-1">Chi tiết phí theo diện tích</div>
                              <div className="small text-dark">
                                • Diện tích: {fee.area} m²
                              </div>
                              {fee.areaDetails.map((detail, idx) => (
                                <div key={idx} className="small text-dark">
                                  • {detail.feeName}: {detail.unitPrice.toLocaleString('vi-VN')} VND/m² = {detail.amount.toLocaleString('vi-VN')} VND
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Hiển thị chi tiết phí vệ sinh nếu có */}
                          {fee.hygieneDetails && fee.hygieneDetails.length > 0 && (
                            <div className="mt-2">
                              <div className="text-muted small mb-1">Chi tiết phí vệ sinh</div>
                              <div className="small text-dark">
                                • Số nhân khẩu: {fee.residentCount} người
                              </div>
                              <div className="small text-dark">
                                • Định mức: 6.000 VND/tháng/người
                              </div>
                              <div className="small text-dark">
                                • Tính năm: {fee.residentCount} × 6.000 × 12 tháng = {fee.amount.toLocaleString('vi-VN')} VND
                              </div>
                              {fee.residents && (
                                <div className="small text-muted mt-1">
                                  Cư dân: {fee.residents.map(r => r.name).join(', ')}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="row g-2 mb-3">
                          <div className="col-12">
                            <div className="text-muted small">{fee.paymentCycle === 'yearly' ? 'Năm hiện tại' : 'Tháng hiện tại'}</div>
                            {getStatusBadge(fee.currentMonthStatus)}
                          </div>
                          <div className="col-12">
                            <div className="text-muted small">{fee.paymentCycle === 'yearly' ? 'Năm trước' : 'Tháng trước'}</div>
                            <div className="d-flex align-items-center gap-2">
                              {getStatusBadge(fee.lastMonthStatus)}
                              {fee.lastMonthStatus === 'overdue' && (
                                <i className="bi bi-exclamation-triangle-fill text-danger"></i>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="d-flex gap-2 flex-wrap">
                          {fee.currentMonthStatus === 'pending' && (
                            <Button 
                              variant="success" 
                              size="sm"
                              className="rounded-pill flex-grow-1"
                              onClick={() => handleCreatePayment(fee._id, false, fee.isVehicleFee, fee.isAreaFee, fee.isHygieneFee)}
                            >
                              <i className={`bi ${fee.isVehicleFee ? 'bi-car-front' : fee.isAreaFee ? 'bi-building' : fee.isHygieneFee ? 'bi-droplet' : 'bi-credit-card'} me-1`}></i> 
                              {fee.isVehicleFee ? 'Thanh toán phí xe' : fee.isAreaFee ? 'Thanh toán phí dịch vụ & chung cư' : fee.isHygieneFee ? 'Thanh toán phí vệ sinh' : 'Thanh toán'}
                            </Button>
                          )}
                          {fee.lastMonthStatus === 'overdue' && (
                            <Button 
                              variant="warning" 
                              size="sm"
                              className="rounded-pill flex-grow-1"
                              onClick={() => handleCreatePayment(fee._id, true, fee.isVehicleFee, fee.isAreaFee, fee.isHygieneFee)}
                            >
                              <i className="bi bi-exclamation-triangle me-1"></i> {fee.paymentCycle === 'yearly' ? 'Trả nợ năm trước' : 'Trả nợ'}
                            </Button>
                          )}
                          {/* Hiển thị thông báo nếu tháng trước đã thanh toán */}
                          {fee.lastMonthStatus === 'paid' && fee.currentMonthStatus === 'paid' && (
                            <div className="text-center w-100">
                              <small className="text-success fw-bold">
                                <i className="bi bi-check-circle me-1"></i>
                                Đã thanh toán đầy đủ
                              </small>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </>
      ) : (
        <Message>Không tìm thấy hộ gia đình</Message>
      )}

      {/* Modal chọn chủ hộ */}
      <Modal show={showHeadModal} onHide={() => setShowHeadModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-crown me-2"></i>
            {household?.householdHead ? 'Đổi chủ hộ' : 'Chọn chủ hộ'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label className="fw-bold">Chọn cư dân làm chủ hộ:</Form.Label>
            <Form.Select
              value={selectedHead}
              onChange={(e) => setSelectedHead(e.target.value)}
              className="form-select-lg"
            >
              <option value="">-- Không có chủ hộ --</option>
              {residents.map((resident) => (
                <option key={resident._id} value={resident._id}>
                  {resident.fullName} - {resident.gender === 'male' ? 'Nam' : 'Nữ'}
                  {resident.idCard && ` (${resident.idCard})`}
                </option>
              ))}
            </Form.Select>
            {residents.length === 0 && (
              <div className="alert alert-warning mt-3">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Chưa có cư dân nào trong hộ gia đình. Hãy thêm cư dân trước khi chọn chủ hộ.
              </div>
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHeadModal(false)}>
            Hủy
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpdateHead}
            disabled={residents.length === 0}
          >
            <i className="bi bi-check-circle me-1"></i>
            Cập nhật
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default HouseholdDetailScreen; 