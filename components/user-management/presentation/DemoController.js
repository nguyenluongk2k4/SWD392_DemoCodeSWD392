// User Management - Presentation - Demo Controller
// Endpoint để demo luồng chạy qua các tầng của kiến trúc

const logger = require('../../../shared-kernel/utils/logger');
const ResponseHandler = require('../../../shared-kernel/utils/response');
const DataCollectorService = require('../../../components/data-ingestion/application/DataCollectorService');

class DemoController {
  
  /**
   * Demo luồng chạy từ Presentation → Application → Domain → Infrastructure
   * GET /api/demo/architecture-flow
   */
  async showArchitectureFlow(req, res) {
    try {
      const flowSteps = [];
      
      // BƯỚC 1: PRESENTATION LAYER (Controller)
      flowSteps.push({
        layer: '1️⃣ PRESENTATION LAYER',
        component: 'DemoController.js',
        description: 'Nhận HTTP Request từ client',
        details: {
          method: req.method,
          path: req.path,
          headers: Object.keys(req.headers),
          body: req.body || 'No body'
        },
        responsibility: 'Xử lý HTTP request/response, validate input, gọi Application Service'
      });

      // BƯỚC 2: APPLICATION LAYER (Service/Use Case)
      flowSteps.push({
        layer: '2️⃣ APPLICATION LAYER',
        component: 'UserService.js / AuthService.js',
        description: 'Xử lý business logic và use cases',
        details: {
          examples: [
            'UserService.createUser() - UC06: Tạo người dùng mới',
            'AuthService.login() - UC01: Đăng nhập',
            'RoleService.assignRole() - UC07: Phân quyền'
          ]
        },
        responsibility: 'Orchestrate business logic, gọi Domain entities và Infrastructure repositories'
      });

      // BƯỚC 3: DOMAIN LAYER (Entities)
      flowSteps.push({
        layer: '3️⃣ DOMAIN LAYER',
        component: 'User.js / Role.js',
        description: 'Core business entities và domain logic',
        details: {
          entities: {
            User: ['username', 'email', 'password', 'role', 'validatePassword()'],
            Role: ['name', 'permissions', 'hasPermission()']
          }
        },
        responsibility: 'Chứa core business rules, không phụ thuộc vào infrastructure'
      });

      // BƯỚC 4: INFRASTRUCTURE LAYER (Repository/External Services)
      flowSteps.push({
        layer: '4️⃣ INFRASTRUCTURE LAYER',
        component: 'UserRepository.js / RoleRepository.js',
        description: 'Tương tác với database, external services',
        details: {
          operations: [
            'UserRepository.create() → MongoDB',
            'UserRepository.findByEmail() → MongoDB',
            'RoleRepository.findById() → MongoDB'
          ]
        },
        responsibility: 'Database operations, External API calls, File I/O'
      });

      // BƯỚC 5: SHARED KERNEL (Cross-cutting concerns)
      flowSteps.push({
        layer: '5️⃣ SHARED KERNEL',
        component: 'Logger, EventBus, Config, Utils',
        description: 'Các module dùng chung cho tất cả components',
        details: {
          modules: {
            'Config': 'Quản lý cấu hình hệ thống',
            'Logger': 'Ghi log ứng dụng',
            'EventBus': 'Giao tiếp bất đồng bộ giữa các components',
            'Utils': 'Các hàm tiện ích (validator, response helper)'
          }
        },
        responsibility: 'Infrastructure dùng chung, tránh duplicate code'
      });

      // BƯỚC 6: COMMUNICATION FLOW
      flowSteps.push({
        layer: '6️⃣ LUỒNG GIAO TIẾP GIỮA CÁC COMPONENTS',
        component: 'Event Bus / API Gateway',
        description: 'Các components giao tiếp với nhau như thế nào',
        details: {
          synchronous: 'REST API qua API Gateway',
          asynchronous: 'Event Bus (RabbitMQ/Kafka)',
          example: [
            '📊 Data-Ingestion nhận sensor data → Phát event "SENSOR_DATA_RECEIVED"',
            '🤖 Automation-Engine lắng nghe event → So sánh threshold → Phát event "THRESHOLD_EXCEEDED"',
            '🔔 Monitoring-Logging lắng nghe event → Gửi alert → Lưu log'
          ]
        },
        responsibility: 'Loose coupling giữa các components'
      });

      // VÍ DỤ CỤ THỂ: User Login Flow
      const loginFlowExample = {
        useCase: 'UC01: Đăng nhập hệ thống',
        flow: [
          {
            step: 1,
            layer: 'Presentation',
            action: 'POST /api/auth/login',
            file: 'AuthController.js',
            code: 'authController.login(req, res)'
          },
          {
            step: 2,
            layer: 'Application',
            action: 'Validate credentials & generate JWT',
            file: 'AuthService.js',
            code: 'const token = await authService.login(email, password)'
          },
          {
            step: 3,
            layer: 'Domain',
            action: 'Check password validity',
            file: 'User.js',
            code: 'const isValid = await user.validatePassword(password)'
          },
          {
            step: 4,
            layer: 'Infrastructure',
            action: 'Query database for user',
            file: 'UserRepository.js',
            code: 'const user = await userRepository.findByEmail(email)'
          },
          {
            step: 5,
            layer: 'Presentation',
            action: 'Return JWT token to client',
            file: 'AuthController.js',
            code: 'res.json({ token, user })'
          }
        ]
      };

      // DANH SÁCH COMPONENTS VÀ USE CASES
      const componentMapping = {
        'user-management': {
          useCases: ['UC01: Login', 'UC06: User CRUD', 'UC07: Role Management'],
          layers: {
            presentation: ['AuthController.js', 'UserController.js'],
            application: ['AuthService.js', 'UserService.js', 'RoleService.js'],
            domain: ['User.js', 'Role.js'],
            infrastructure: ['UserRepository.js', 'RoleRepository.js']
          }
        },
        'data-ingestion': {
          useCases: ['UC08: Thu thập dữ liệu sensor'],
          layers: {
            application: ['DataCollectorService.js'],
            domain: ['SensorData.js'],
            infrastructure: ['MqttHandler.js', 'SensorDataRepository.js']
          }
        },
        'device-control': {
          useCases: ['UC03: Điều khiển thiết bị'],
          layers: {
            presentation: ['DeviceController.js'],
            application: ['ActuatorService.js'],
            domain: ['Actuator.js'],
            infrastructure: ['ActuatorRepository.js', 'MqttPublishService.js']
          }
        },
        'automation-engine': {
          useCases: ['UC04: Tự động hóa', 'UC05: Quản lý ngưỡng', 'UC09: Alert'],
          layers: {
            presentation: ['ThresholdController.js'],
            application: ['AutomationService.js', 'ThresholdService.js', 'NotificationService.js'],
            domain: ['Threshold.js', 'Alert.js'],
            infrastructure: ['ThresholdRepository.js', 'AlertingClients.js']
          }
        },
        'monitoring-logging': {
          useCases: ['UC02: Dashboard', 'UC12: Report', 'UC13: Incident'],
          layers: {
            presentation: ['DashboardController.js', 'IncidentController.js'],
            application: ['MonitoringService.js', 'IncidentService.js', 'LogService.js'],
            domain: ['IncidentReport.js'],
            infrastructure: ['SensorDataRepository.js', 'IncidentRepository.js']
          }
        }
      };

      const response = {
        title: '🏗️ KIẾN TRÚC COMPONENT-BASED - SMART AGRICULTURE SYSTEM',
        architecture: 'Clean Architecture / Hexagonal Architecture',
        description: 'Mỗi component được tổ chức theo 4 tầng: Presentation → Application → Domain → Infrastructure',
        
        flowSteps,
        loginFlowExample,
        componentMapping,
        
        benefits: [
          '✅ Separation of Concerns: Mỗi layer có trách nhiệm riêng',
          '✅ Testability: Dễ dàng test từng layer độc lập',
          '✅ Maintainability: Thay đổi một layer không ảnh hưởng layer khác',
          '✅ Scalability: Dễ dàng thêm component mới',
          '✅ Reusability: Shared kernel được dùng chung'
        ],
        
        nextSteps: [
          '1. Cấu hình MongoDB (ENABLE_DATABASE=true)',
          '2. Cấu hình MQTT Broker (ENABLE_MQTT=true)',
          '3. Test từng endpoint: /api/auth/login, /api/users, /api/devices',
          '4. Kiểm tra event flow giữa các components',
          '5. Deploy và scale từng component độc lập'
        ]
      };

      logger.info(`✅ Architecture flow displayed successfully`);
      
      return successResponse(res, response, 'Architecture flow retrieved successfully');
      
    } catch (error) {
      logger.error('Error showing architecture flow:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Demo test một use case cụ thể (giả lập không cần DB)
   * POST /api/demo/test-flow
   */
  async testUseCaseFlow(req, res) {
    try {
      const { useCase } = req.body;
      
      const flowLogs = [];
      
      // Giả lập flow của UC01: Login
      if (useCase === 'UC01' || useCase === 'login') {
        const startTime = Date.now();
        
        // Step 1: Presentation Layer
        flowLogs.push({
          timestamp: new Date().toISOString(),
          layer: 'Presentation',
          file: 'AuthController.js',
          action: 'Receive POST /api/auth/login',
          input: { email: 'demo@example.com', password: '******' },
          duration: 1
        });
        
        // Step 2: Application Layer
        flowLogs.push({
          timestamp: new Date().toISOString(),
          layer: 'Application',
          file: 'AuthService.js',
          action: 'authService.login() called',
          process: 'Validating credentials and generating JWT',
          duration: 15
        });
        
        // Step 3: Domain Layer
        flowLogs.push({
          timestamp: new Date().toISOString(),
          layer: 'Domain',
          file: 'User.js',
          action: 'user.validatePassword() called',
          process: 'Checking password hash with bcrypt',
          result: 'Password is valid ✅',
          duration: 50
        });
        
        // Step 4: Infrastructure Layer
        flowLogs.push({
          timestamp: new Date().toISOString(),
          layer: 'Infrastructure',
          file: 'UserRepository.js',
          action: 'userRepository.findByEmail() called',
          query: 'MongoDB query: { email: "demo@example.com" }',
          result: 'User found in database ✅',
          duration: 25
        });
        
        // Step 5: Response
        const totalDuration = Date.now() - startTime;
        flowLogs.push({
          timestamp: new Date().toISOString(),
          layer: 'Presentation',
          file: 'AuthController.js',
          action: 'Send response to client',
          output: {
            success: true,
            token: 'jwt.token.here',
            user: { id: '123', email: 'demo@example.com', role: 'admin' }
          },
          duration: 2,
          totalDuration: totalDuration + 'ms'
        });
        
        logger.info(`✅ UC01 Login flow test completed`);
        
        return successResponse(res, {
          useCase: 'UC01: User Login',
          status: 'SUCCESS',
          flowLogs,
          summary: {
            totalSteps: flowLogs.length,
            totalDuration: totalDuration + 'ms',
            layersInvolved: ['Presentation', 'Application', 'Domain', 'Infrastructure']
          }
        }, 'Use case flow executed successfully');
      }
      
      // Default response
      return res.status(400).json({
        success: false,
        message: 'Invalid use case. Try: UC01, login',
        availableUseCases: ['UC01', 'login']
      });
      
    } catch (error) {
      logger.error('Error testing use case flow:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Xem sensor data real-time (để kiểm tra subscription)
   * GET /api/demo/sensor-data
   */
  async getSensorData(req, res) {
    try {
      const { sensorId, limit = 10 } = req.query;

      let data;
      if (sensorId) {
        // Lấy data của sensor cụ thể
        data = await DataCollectorService.getLatestData(sensorId);
        if (data) {
          data = [data]; // Wrap in array for consistency
        } else {
          data = [];
        }
      } else {
        // Lấy tất cả sensor data gần đây
        data = await DataCollectorService.getRecentData(parseInt(limit));
      }

      return ResponseHandler.success(res, {
        sensorData: data,
        total: data.length,
        mqttConnected: require('../../../components/data-ingestion/infrastructure/MqttHandler').isConnected,
        lastUpdated: data.length > 0 ? data[0]?.timestamp : null
      }, 'Sensor data retrieved successfully');

    } catch (error) {
      logger.error('Error getting sensor data:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get sensor data',
        error: error.message
      });
    }
  }
}

module.exports = new DemoController();
