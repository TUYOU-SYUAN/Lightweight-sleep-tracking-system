<?php
/**
 * 資料庫連接類
 * 提供 MySQL 資料庫連接和操作接口
 */

require_once __DIR__ . '/../config/config.php';

class Database {
    private static $instance = null;
    private $connection;
    private $lastError;
    private $lastQuery;

    /**
     * 私有構造函數 - 防止外部直接實例化
     */
    private function __construct() {
        $this->connect();
    }

    /**
     * 獲取資料庫單例
     * @return Database
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * 連接資料庫
     */
    private function connect() {
        try {
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                DB_HOST,
                DB_PORT,
                DB_NAME,
                DB_CHARSET
            );

            $this->connection = new PDO(
                $dsn,
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );

            if (APP_DEBUG) {
                echo "資料庫連接成功\n";
            }
        } catch (PDOException $e) {
            $this->lastError = $e->getMessage();
            if (APP_DEBUG) {
                throw new Exception("資料庫連接失敗: " . $e->getMessage());
            } else {
                error_log("資料庫連接失敗: " . $e->getMessage());
            }
        }
    }

    /**
     * 執行查詢
     * @param string $sql - SQL 語句
     * @param array $params - 參數陣列
     * @return array - 查詢結果
     */
    public function query($sql, $params = []) {
        try {
            $this->lastQuery = $sql;
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            $this->lastError = $e->getMessage();
            error_log("查詢失敗: " . $e->getMessage());
            return [];
        }
    }

    /**
     * 執行單行查詢
     * @param string $sql - SQL 語句
     * @param array $params - 參數陣列
     * @return array|null - 查詢結果或 null
     */
    public function queryRow($sql, $params = []) {
        try {
            $this->lastQuery = $sql;
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetch();
        } catch (PDOException $e) {
            $this->lastError = $e->getMessage();
            error_log("查詢失敗: " . $e->getMessage());
            return null;
        }
    }

    /**
     * 執行插入操作
     * @param string $sql - SQL 語句
     * @param array $params - 參數陣列
     * @return int|false - 影響行數或 false
     */
    public function insert($sql, $params = []) {
        try {
            $this->lastQuery = $sql;
            $stmt = $this->connection->prepare($sql);
            $result = $stmt->execute($params);
            return $result ? $this->connection->lastInsertId() : false;
        } catch (PDOException $e) {
            $this->lastError = $e->getMessage();
            error_log("插入失敗: " . $e->getMessage());
            return false;
        }
    }

    /**
     * 執行更新操作
     * @param string $sql - SQL 語句
     * @param array $params - 參數陣列
     * @return int|false - 影響行數或 false
     */
    public function update($sql, $params = []) {
        try {
            $this->lastQuery = $sql;
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            $this->lastError = $e->getMessage();
            error_log("更新失敗: " . $e->getMessage());
            return false;
        }
    }

    /**
     * 執行刪除操作
     * @param string $sql - SQL 語句
     * @param array $params - 參數陣列
     * @return int|false - 影響行數或 false
     */
    public function delete($sql, $params = []) {
        try {
            $this->lastQuery = $sql;
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            $this->lastError = $e->getMessage();
            error_log("刪除失敗: " . $e->getMessage());
            return false;
        }
    }

    /**
     * 開始事務
     */
    public function beginTransaction() {
        try {
            $this->connection->beginTransaction();
        } catch (PDOException $e) {
            $this->lastError = $e->getMessage();
            error_log("開始事務失敗: " . $e->getMessage());
        }
    }

    /**
     * 提交事務
     */
    public function commit() {
        try {
            $this->connection->commit();
        } catch (PDOException $e) {
            $this->lastError = $e->getMessage();
            error_log("提交事務失敗: " . $e->getMessage());
        }
    }

    /**
     * 回滾事務
     */
    public function rollback() {
        try {
            $this->connection->rollBack();
        } catch (PDOException $e) {
            $this->lastError = $e->getMessage();
            error_log("回滾事務失敗: " . $e->getMessage());
        }
    }

    /**
     * 獲取最後的錯誤信息
     * @return string
     */
    public function getLastError() {
        return $this->lastError;
    }

    /**
     * 獲取最後執行的 SQL 語句
     * @return string
     */
    public function getLastQuery() {
        return $this->lastQuery;
    }

    /**
     * 關閉資料庫連接
     */
    public function close() {
        $this->connection = null;
    }
}
