import grpc
from concurrent import futures
import time

# Import các class đã được sinh tự động từ file .proto
import actuator_pb2
import actuator_pb2_grpc

# Lớp này chứa logic xử lý cho các yêu cầu gRPC.
# Tên lớp và các phương thức phải khớp với những gì định nghĩa trong service của file .proto
class ActuatorManagerService(actuator_pb2_grpc.ActuatorManagerServiceServicer):

    # Đây là hàm sẽ được gọi khi có yêu cầu RPC ControlActuator
    def ControlActuator(self, request, context):
        print("=====================================================")
        print("✅ YÊU CẦU 'ControlActuator' ĐÃ NHẬN!")
        print(f"   - Device ID: {request.device_id}")
        print(f"   - Action: {actuator_pb2.ControlAction.Name(request.action)}")
        print("-----------------------------------------------------")
        print("Nội dung gói tin (Request Object):")
        print(request)
        print("=====================================================\n")

        # Tạo một phản hồi giả (mock response) để trả về cho client
        # Client sẽ nhận được thông tin này
        response_actuator = actuator_pb2.Actuator(
            device_id=request.device_id,
            name=f"Pump {request.device_id}",
            actuator_type_name="pump",
            farm_id="farm-01",
            zone_id="zone-A",
            # Cập nhật trạng thái dựa trên action nhận được
            status=actuator_pb2.ON if request.action == actuator_pb2.TURN_ON else actuator_pb2.OFF,
            mode=actuator_pb2.MANUAL
        )
        
        return actuator_pb2.ControlActuatorResponse(actuator=response_actuator)

    # Xử lý cho các RPC khác (nếu bạn muốn test)
    def GetActuatorStatus(self, request, context):
        print(f"✅ YÊU CẦU 'GetActuatorStatus' ĐÃ NHẬN cho device_id: {request.device_id}")
        # Tạo phản hồi giả
        return actuator_pb2.Actuator(
            device_id=request.device_id,
            name=f"Pump {request.device_id}",
            status=actuator_pb2.OFF,
            mode=actuator_pb2.MANUAL
        )

# Hàm chính để khởi chạy server
def serve():
    # Tạo một server với 10 worker threads
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    
    # Đăng ký lớp xử lý logic của chúng ta với server
    actuator_pb2_grpc.add_ActuatorManagerServiceServicer_to_server(
        ActuatorManagerService(), server
    )
    
    # Mở một cổng (port) để lắng nghe.
    # '[::]:50051' nghĩa là lắng nghe trên tất cả các địa chỉ IP có sẵn của máy tính, ở cổng 50051
    port = '50051'
    server.add_insecure_port('[::]:' + port)
    
    # Khởi động server
    server.start()
    print(f"🚀 Server gRPC đang lắng nghe trên cổng {port}...")
    
    # Vòng lặp vô tận để giữ cho server chạy
    try:
        while True:
            time.sleep(86400) # Ngủ một ngày
    except KeyboardInterrupt:
        # Dừng server khi bạn nhấn Ctrl+C
        print("🛑 Dừng server.")
        server.stop(0)

# Chạy hàm serve() khi file này được thực thi
if __name__ == '__main__':
    serve()