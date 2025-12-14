<?php
/**
 * 鬧鐘模型類
 * 處理鬧鐘的資料庫操作
 */

require_once __DIR__ . '/../database/Database.php';

class Alarm {
    private $db;
    private $table = 'alarms';

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * 建立新鬧鐘
     * @param array $data - 鬧鐘資料
     * @return int|false - 新鬧鐘的 ID 或 false
     */
    public function create($data) {
        $sql = "INSERT INTO {$this->table} 
                (user_id, wakeup_time, smart_wakeup_time, alarm_name, days, enabled, created_at, updated_at) 
                VALUES 
                (:user_id, :wakeup_time, :smart_wakeup_time, :alarm_name, :days, :enabled, :created_at, :updated_at)";

        $params = [
            ':user_id' => $data['user_id'] ?? 1, // 暫時使用預設用戶
            ':wakeup_time' => $data['wakeup_time'],
            ':smart_wakeup_time' => $data['smart_wakeup_time'],
            ':alarm_name' => $data['alarm_name'] ?? '鬧鐘',
            ':days' => json_encode($data['days'] ?? []),
            ':enabled' => $data['enabled'] ? 1 : 0,
            ':created_at' => date('Y-m-d H:i:s'),
            ':updated_at' => date('Y-m-d H:i:s'),
        ];

        return $this->db->insert($sql, $params);
    }

    /**
     * 獲取用戶的所有鬧鐘
     * @param int $userId - 用戶 ID
     * @return array - 鬧鐘陣列
     */
    public function getByUserId($userId = 1) {
        $sql = "SELECT * FROM {$this->table} WHERE user_id = :user_id ORDER BY wakeup_time ASC";
        $result = $this->db->query($sql, [':user_id' => $userId]);

        // 解析 JSON 日期資料
        foreach ($result as &$alarm) {
            $alarm['days'] = json_decode($alarm['days'], true) ?? [];
        }

        return $result;
    }

    /**
     * 根據 ID 獲取鬧鐘
     * @param int $alarmId - 鬧鐘 ID
     * @return array|null - 鬧鐘資料或 null
     */
    public function getById($alarmId) {
        $sql = "SELECT * FROM {$this->table} WHERE id = :id";
        $alarm = $this->db->queryRow($sql, [':id' => $alarmId]);

        if ($alarm) {
            $alarm['days'] = json_decode($alarm['days'], true) ?? [];
        }

        return $alarm;
    }

    /**
     * 更新鬧鐘
     * @param int $alarmId - 鬧鐘 ID
     * @param array $data - 更新資料
     * @return int|false - 影響行數或 false
     */
    public function update($alarmId, $data) {
        $setClause = [];
        $params = [':id' => $alarmId];

        foreach ($data as $key => $value) {
            if (in_array($key, ['wakeup_time', 'smart_wakeup_time', 'alarm_name', 'days', 'enabled'])) {
                $setClause[] = "$key = :$key";
                if ($key === 'days') {
                    $params[":$key"] = json_encode($value);
                } elseif ($key === 'enabled') {
                    $params[":$key"] = $value ? 1 : 0;
                } else {
                    $params[":$key"] = $value;
                }
            }
        }

        $setClause[] = "updated_at = :updated_at";
        $params[':updated_at'] = date('Y-m-d H:i:s');

        $sql = "UPDATE {$this->table} SET " . implode(', ', $setClause) . " WHERE id = :id";

        return $this->db->update($sql, $params);
    }

    /**
     * 刪除鬧鐘
     * @param int $alarmId - 鬧鐘 ID
     * @return int|false - 影響行數或 false
     */
    public function delete($alarmId) {
        $sql = "DELETE FROM {$this->table} WHERE id = :id";
        return $this->db->delete($sql, [':id' => $alarmId]);
    }

    /**
     * 根據日期獲取啟用的鬧鐘
     * @param string $day - 日期（'monday', 'tuesday' 等）
     * @param int $userId - 用戶 ID
     * @return array - 鬧鐘陣列
     */
    public function getByDay($day, $userId = 1) {
        $alarms = $this->getByUserId($userId);
        $result = [];

        foreach ($alarms as $alarm) {
            if ($alarm['enabled'] && in_array($day, $alarm['days'])) {
                $result[] = $alarm;
            }
        }

        return $result;
    }

    /**
     * 判斷鬧鐘名稱是否存在
     * @param string $name - 鬧鐘名稱
     * @param int $userId - 用戶 ID
     * @param int|null $excludeId - 排除的 ID（用於更新時）
     * @return bool
     */
    public function nameExists($name, $userId = 1, $excludeId = null) {
        $sql = "SELECT COUNT(*) as count FROM {$this->table} WHERE alarm_name = :name AND user_id = :user_id";
        $params = [':name' => $name, ':user_id' => $userId];

        if ($excludeId !== null) {
            $sql .= " AND id != :id";
            $params[':id'] = $excludeId;
        }

        $result = $this->db->queryRow($sql, $params);
        return $result && $result['count'] > 0;
    }
}
