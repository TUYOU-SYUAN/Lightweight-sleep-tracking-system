<?php
/**
 * 鬧鐘 API 控制器
 * 處理鬧鐘相關的 API 請求
 */

require_once __DIR__ . '/../database/Alarm.php';
require_once __DIR__ . '/ApiResponse.php';

class AlarmController {
    private $alarmModel;
    private $response;

    public function __construct() {
        $this->alarmModel = new Alarm();
        $this->response = new ApiResponse();
    }

    /**
     * 獲取所有鬧鐘
     * GET /api/alarms
     */
    public function getAll() {
        $userId = $_GET['user_id'] ?? 1;

        $alarms = $this->alarmModel->getByUserId($userId);

        return $this->response->success(
            $alarms,
            'Alarms retrieved successfully'
        );
    }

    /**
     * 根據 ID 獲取鬧鐘
     * GET /api/alarms/:id
     */
    public function getById($id) {
        $alarm = $this->alarmModel->getById($id);

        if (!$alarm) {
            return $this->response->notFound('Alarm not found');
        }

        return $this->response->success($alarm, 'Alarm retrieved successfully');
    }

    /**
     * 建立新鬧鐘
     * POST /api/alarms
     */
    public function create() {
        $input = json_decode(file_get_contents('php://input'), true);

        // 驗證必填欄位
        $errors = $this->validateAlarmData($input);
        if (!empty($errors)) {
            return $this->response->unprocessable($errors);
        }

        // 建立鬧鐘
        $alarmId = $this->alarmModel->create($input);

        if (!$alarmId) {
            return $this->response->error('Failed to create alarm', 500);
        }

        $alarm = $this->alarmModel->getById($alarmId);

        return $this->response->created(
            $alarm,
            'Alarm created successfully'
        );
    }

    /**
     * 更新鬧鐘
     * PUT /api/alarms/:id
     */
    public function update($id) {
        // 檢查鬧鐘是否存在
        $alarm = $this->alarmModel->getById($id);
        if (!$alarm) {
            return $this->response->notFound('Alarm not found');
        }

        $input = json_decode(file_get_contents('php://input'), true);

        // 驗證數據
        $errors = $this->validateAlarmData($input, true);
        if (!empty($errors)) {
            return $this->response->unprocessable($errors);
        }

        // 更新鬧鐘
        $result = $this->alarmModel->update($id, $input);

        if (!$result) {
            return $this->response->error('Failed to update alarm', 500);
        }

        $updatedAlarm = $this->alarmModel->getById($id);

        return $this->response->success(
            $updatedAlarm,
            'Alarm updated successfully'
        );
    }

    /**
     * 刪除鬧鐘
     * DELETE /api/alarms/:id
     */
    public function delete($id) {
        // 檢查鬧鐘是否存在
        $alarm = $this->alarmModel->getById($id);
        if (!$alarm) {
            return $this->response->notFound('Alarm not found');
        }

        // 刪除鬧鐘
        $result = $this->alarmModel->delete($id);

        if (!$result) {
            return $this->response->error('Failed to delete alarm', 500);
        }

        return $this->response->success(
            ['id' => $id],
            'Alarm deleted successfully'
        );
    }

    /**
     * 驗證鬧鐘資料
     * @param array $data - 輸入資料
     * @param bool $isUpdate - 是否是更新操作
     * @return array - 驗證錯誤陣列
     */
    private function validateAlarmData($data, $isUpdate = false) {
        $errors = [];

        if (!$isUpdate) {
            // 建立時的必填欄位驗證
            if (empty($data['wakeup_time'])) {
                $errors[] = 'wakeup_time is required';
            }

            if (empty($data['smart_wakeup_time'])) {
                $errors[] = 'smart_wakeup_time is required';
            }
        }

        // 檢查時間格式
        if (!empty($data['wakeup_time']) && !$this->isValidTime($data['wakeup_time'])) {
            $errors[] = 'wakeup_time must be in HH:mm format';
        }

        if (!empty($data['smart_wakeup_time']) && !$this->isValidTime($data['smart_wakeup_time'])) {
            $errors[] = 'smart_wakeup_time must be in HH:mm format';
        }

        // 檢查鬧鐘名稱
        if (!empty($data['alarm_name'])) {
            if (strlen($data['alarm_name']) > 50) {
                $errors[] = 'alarm_name must not exceed 50 characters';
            }
        }

        // 檢查日期資料
        if (!empty($data['days'])) {
            if (!is_array($data['days'])) {
                $errors[] = 'days must be an array';
            }
        }

        return $errors;
    }

    /**
     * 驗證時間格式（HH:mm）
     * @param string $time - 時間字符串
     * @return bool
     */
    private function isValidTime($time) {
        return preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $time) === 1;
    }

    /**
     * 獲取特定日期的鬧鐘
     * GET /api/alarms/day/:day
     */
    public function getByDay($day) {
        $userId = $_GET['user_id'] ?? 1;
        $alarms = $this->alarmModel->getByDay($day, $userId);

        return $this->response->success(
            $alarms,
            'Alarms for the specified day retrieved successfully'
        );
    }
}
